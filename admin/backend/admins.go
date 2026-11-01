package main

import (
	"crypto/pbkdf2"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"embed"
	"encoding/base64"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"gopkg.in/yaml.v3"
)

//go:embed all:data
var embeddedData embed.FS

const (
	defaultAdminsFile = "data/admins.yaml"
	pbkdf2Iterations  = 600000
)

type adminRecord struct {
	Username     string `yaml:"username" json:"username"`
	DisplayName  string `yaml:"displayName" json:"displayName"`
	Email        string `yaml:"email" json:"email"`
	Role         string `yaml:"role" json:"role"`
	Status       string `yaml:"status" json:"status"`
	CreatedAt    string `yaml:"createdAt" json:"createdAt"`
	LastLogin    string `yaml:"lastLogin" json:"lastLogin"`
	PasswordHash string `yaml:"passwordHash" json:"-"`
}

type adminFile struct {
	Admins []adminRecord `yaml:"admins"`
}

type adminStore struct {
	mu     sync.Mutex
	path   string
	source string
}

func newAdminStore(path string) *adminStore {
	store := &adminStore{path: path}
	store.source = store.resolveSource()
	return store
}

func (s *adminStore) resolveSource() string {
	if s.path == "" {
		return "embedded"
	}

	if _, err := os.Stat(s.path); err == nil {
		return s.path
	}

	return "embedded"
}

func (s *adminStore) read() (adminFile, error) {
	if s.path != "" {
		data, err := os.ReadFile(s.path)
		if err == nil {
			return parseAdmins(data)
		}
		if !errors.Is(err, os.ErrNotExist) {
			return adminFile{}, err
		}
	}

	data, err := fs.ReadFile(embeddedData, defaultAdminsFile)
	if err != nil {
		return adminFile{}, err
	}

	return parseAdmins(data)
}

func parseAdmins(data []byte) (adminFile, error) {
	var file adminFile
	if err := yaml.Unmarshal(data, &file); err != nil {
		return adminFile{}, err
	}

	for index := range file.Admins {
		record := &file.Admins[index]
		record.Username = strings.TrimSpace(record.Username)
		record.Status = strings.ToLower(strings.TrimSpace(record.Status))
		record.Role = strings.ToLower(strings.TrimSpace(record.Role))

		if record.Status == "" {
			record.Status = "active"
		}
		if record.DisplayName == "" {
			record.DisplayName = record.Username
		}
	}

	return file, nil
}

func (s *adminStore) list() ([]adminRecord, string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	file, err := s.read()
	if err != nil {
		return nil, "", err
	}

	return file.Admins, s.source, nil
}

func (s *adminStore) find(username string) (adminRecord, bool) {
	admins, _, err := s.list()
	if err != nil {
		return adminRecord{}, false
	}

	for _, record := range admins {
		if secureEqual(record.Username, username) {
			return record, true
		}
	}

	return adminRecord{}, false
}

func (s *adminStore) authenticate(username, password string) bool {
	record, ok := s.find(username)
	if !ok || record.Status != "active" {
		return false
	}

	return verifyPassword(record.PasswordHash, password)
}

func (s *adminStore) touchLastLogin(username string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	file, err := s.read()
	if err != nil {
		return
	}

	changed := false
	for index := range file.Admins {
		if file.Admins[index].Username != username {
			continue
		}
		file.Admins[index].LastLogin = time.Now().UTC().Format(time.RFC3339)
		changed = true
		break
	}

	if !changed || s.path == "" {
		return
	}

	data, err := yaml.Marshal(file)
	if err != nil {
		slogWarn("failed to encode admin roster", "error", err)
		return
	}

	if err := os.WriteFile(s.path, data, 0o600); err != nil {
		slogWarn("failed to update admin roster", "error", err)
	}
}

func verifyPassword(encoded, password string) bool {
	parts := strings.Split(encoded, "$")
	if len(parts) != 4 || parts[0] != "pbkdf2-sha256" {
		return false
	}

	iterations, err := strconv.Atoi(parts[1])
	if err != nil || iterations <= 0 {
		return false
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[2])
	if err != nil {
		return false
	}

	expected, err := base64.RawStdEncoding.DecodeString(parts[3])
	if err != nil {
		return false
	}

	actual, err := pbkdf2.Key(sha256.New, password, salt, iterations, len(expected))
	if err != nil {
		return false
	}

	return subtle.ConstantTimeCompare(actual, expected) == 1
}

func hashPassword(password string) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	key, err := pbkdf2.Key(sha256.New, password, salt, pbkdf2Iterations, 32)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("pbkdf2-sha256$%d$%s$%s",
		pbkdf2Iterations,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(key),
	), nil
}

func resolveAdminsPath(configured string) string {
	if strings.TrimSpace(configured) != "" {
		return strings.TrimSpace(configured)
	}

	if _, err := os.Stat(filepath.Join("/app", defaultAdminsFile)); err == nil {
		return filepath.Join("/app", defaultAdminsFile)
	}

	return defaultAdminsFile
}
