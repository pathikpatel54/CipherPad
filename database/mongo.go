package database

import (
	"context"
	"log"
	"notes-app/config"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

func GetMongoDB() (*mongo.Database, context.Context) {
	ctx := context.TODO()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(config.Keys.MongoDB))

	if err != nil {
		panic(err)
	}

	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		panic(err)
	}

	log.Println("MongoDB: Successfully connected and pinged.")

	return (client.Database("db")), ctx
}
