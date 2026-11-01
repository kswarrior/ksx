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
	"log/slog"
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
	mu        sync.Mutex
	path      string
	lastLogin map[string]string
}

func newAdminStore(path string) *adminStore {
	return &adminStore{
		path:      path,
		lastLogin: make(map[string]string),
	}
}

func (s *adminStore) source() string {
	if s.path != "" {
		if _, err := os.Stat(s.path); err == nil {
			return s.path
		}
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

	for index := range file.Admins {
		if stamp, ok := s.lastLogin[file.Admins[index].Username]; ok {
			file.Admins[index].LastLogin = stamp
		}
	}

	return file.Admins, s.source(), nil
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

	if s.path == "" {
		return
	}

	data, err := os.ReadFile(s.path)
	if err != nil {
		return
	}

	var root yaml.Node
	if err := yaml.Unmarshal(data, &root); err != nil {
		return
	}

	stamp := time.Now().UTC().Format(time.RFC3339)
	if !setAdminLastLogin(&root, username, stamp) {
		return
	}

	encoded, err := yaml.Marshal(&root)
	if err != nil {
		slog.Debug("failed to encode admin roster", "error", err)
		return
	}

	if err := os.WriteFile(s.path, encoded, 0o600); err != nil {
		slog.Debug("failed to update admin roster", "error", err)
	}
}

func setAdminLastLogin(root *yaml.Node, username, stamp string) bool {
	if root.Kind == yaml.DocumentNode && len(root.Content) > 0 {
		root = root.Content[0]
	}

	if root.Kind != yaml.MappingNode {
		return false
	}

	for index := 0; index+1 < len(root.Content); index += 2 {
		if root.Content[index].Value != "admins" {
			continue
		}

		sequence := root.Content[index+1]
		if sequence.Kind != yaml.SequenceNode {
			return false
		}

		for _, entry := range sequence.Content {
			if entry.Kind != yaml.MappingNode {
				continue
			}

			if adminNodeValue(entry, "username") != username {
				continue
			}

			for field := 0; field+1 < len(entry.Content); field += 2 {
				if entry.Content[field].Value == "lastLogin" {
					entry.Content[field+1].Value = stamp
					entry.Content[field+1].Tag = "!!str"
					return true
				}
			}

			entry.Content = append(entry.Content,
				&yaml.Node{Kind: yaml.ScalarNode, Tag: "!!str", Value: "lastLogin"},
				&yaml.Node{Kind: yaml.ScalarNode, Tag: "!!str", Value: stamp},
			)
			return true
		}
	}

	return false
}

func adminNodeValue(entry *yaml.Node, key string) string {
	for index := 0; index+1 < len(entry.Content); index += 2 {
		if entry.Content[index].Value == key {
			return entry.Content[index+1].Value
		}
	}

	return ""
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
