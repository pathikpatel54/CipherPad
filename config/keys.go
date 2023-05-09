package config

import (
	"encoding/json"
	"fmt"
	"log"
	"notes-app/models"
	"os"
)

var Keys = func() models.Key {
	if os.Getenv("GO_ENV") == "production" {
		return prodConfig
	} else {
		var devConfig models.Key
		devFile, err := os.Open("config/dev.json")
		if err != nil {
			log.Println(err)
		}
		json.NewDecoder(devFile).Decode(&devConfig)
		fmt.Println(devConfig)
		return devConfig
	}
}()
