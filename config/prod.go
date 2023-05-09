package config

import (
	"notes-app/models"
	"os"
)

var prodConfig = models.Key{
	GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
	GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
	MongoDB:            os.Getenv("MONGO_KEY"),
}
