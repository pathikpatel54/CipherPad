package main

import (
	"log"
	"notes-app/config"
	"notes-app/database"
	"notes-app/routes"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func init() {
	log.SetFlags(log.Lshortfile | log.LstdFlags)
}

func main() {

	r := gin.New()
	db, ctx := database.GetMongoDB()

	userRoutes := routes.NewUserController(ctx, db)
	noteRoutes := routes.NewNoteController(db, ctx)

	r.POST("/api/signup", userRoutes.SignUp)
	r.POST("/api/login", userRoutes.Login)
	r.GET("/api/user", userRoutes.User)
	r.GET("/api/logout", userRoutes.Logout)

	r.GET("/api/notes", noteRoutes.NotesIndex)
	r.POST("/api/note", noteRoutes.NewNote)
	r.DELETE("/api/note/:id", noteRoutes.DeleteNote)
	r.GET("/api/notes/socket", noteRoutes.NoteWebsocket)
	r.POST("/api/chatgpt", noteRoutes.OpenAICompletions)

	r.Static("/static", "./notes-client/build/static")

	// Serve the files in the React app's root folder and the entry point (index.html)
	r.NoRoute(func(c *gin.Context) {
		file := filepath.Join("./notes-client/build", c.Request.URL.Path)

		// Check if the requested file exists
		if _, err := os.Stat(file); err == nil {
			// If the file exists, serve it
			c.File(file)
		} else {
			// If the file doesn't exist, serve the React app's index.html
			c.File("./notes-client/build/index.html")
		}
	})

	r.Run(":" + config.Keys.PORT)
}
