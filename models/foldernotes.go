package models

type FolderNotes struct {
	Name  string `json:"name"`
	Notes []Note `json:"notes"`
}
