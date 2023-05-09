package models

type Message struct {
	Type string `json:"type"`
	Note  Note   `json:"new"`
}
