package routes

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"notes-app/models"
	"notes-app/utils"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

type UserController struct {
	db  *mongo.Database
	ctx context.Context
}

func NewUserController(ctx context.Context, db *mongo.Database) *UserController {
	return &UserController{
		db:  db,
		ctx: ctx,
	}
}

func (uc *UserController) User(c *gin.Context) {

	logged, user := isLoggedIn(c, uc.db, uc.ctx)
	if logged {
		c.JSON(http.StatusOK, user)
		return
	}
	c.String(http.StatusUnauthorized, "")
}

func (uc *UserController) Login(c *gin.Context) {
	var user models.User
	err := json.NewDecoder(c.Request.Body).Decode(&user)
	if err != nil {
		log.Println(err.Error())
		c.String(http.StatusBadRequest, "")
		return
	}

	result := uc.db.Collection("users").FindOne(uc.ctx, bson.M{"email": user.Email})

	if result.Err() != nil {
		log.Println(result.Err().Error())
		c.String(http.StatusNotFound, "")
		return
	}

	var foundUser models.User
	result.Decode(&foundUser)

	err = bcrypt.CompareHashAndPassword([]byte(foundUser.Password), []byte(user.Password))
	if err != nil {
		log.Println(err.Error())
		c.String(http.StatusForbidden, "")
		return
	}

	generateSession(&foundUser, c, uc)
	foundUser.Password = ""
	c.JSON(http.StatusOK, foundUser)
}

func (uc *UserController) SignUp(c *gin.Context) {
	var user models.User
	err := json.NewDecoder(c.Request.Body).Decode(&user)

	if err != nil {
		log.Println(err.Error())
		c.String(http.StatusBadRequest, "")
		return
	}

	result := uc.db.Collection("users").FindOne(uc.ctx, bson.M{"email": user.Email})

	if result.Err() == nil {
		c.String(http.StatusConflict, "user with email %s already exists", user.Email)
		return
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), 8)

	if err != nil {
		log.Println(err.Error())
		c.String(http.StatusInternalServerError, "")
		return
	}

	user.Password = string(hashedPassword)

	result = uc.db.Collection("users").FindOneAndUpdate(context.Background(), bson.M{"email": user.Email}, bson.M{"$setOnInsert": user}, options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After))
	if result.Err() != nil {
		log.Println(result.Err().Error())
		c.String(http.StatusInternalServerError, "")
		return
	}
	insertedUser := models.User{}
	if err := result.Decode(&insertedUser); err != nil {
		log.Println(err.Error())
		c.String(http.StatusInternalServerError, "")
		return
	}
	generateSession(&insertedUser, c, uc)
	insertedUser.Password = ""
	c.JSON(http.StatusOK, insertedUser)
}

func (uc *UserController) Logout(c *gin.Context) {
	logged, user := isLoggedIn(c, uc.db, uc.ctx)

	if !logged {
		c.JSON(http.StatusUnauthorized, "")
		return
	}

	_, err := uc.db.Collection("sessions").DeleteMany(uc.ctx, bson.D{{Key: "email", Value: user.Email}})

	if err != nil {
		log.Println(err.Error())
		c.JSON(http.StatusInternalServerError, "")
		return
	}

	c.SetCookie("session", "", -1, "/", c.Request.Host, false, true)
	c.Redirect(http.StatusSeeOther, "/")
}

func generateSession(user *models.User, c *gin.Context, uc *UserController) error {
	sessionID, _ := utils.GenerateRandomString(20)

	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("session", sessionID, (30 * 24 * 60 * 60), "/", c.Request.URL.Host, false, true)

	_, err := uc.db.Collection("sessions").UpdateOne(uc.ctx, bson.D{{Key: "email", Value: user.Email}}, bson.M{
		"$set": bson.M{
			"session-id": sessionID,
			"expires":    time.Now().Add(time.Second * 24 * 60 * 60),
		},
	}, options.Update().SetUpsert(true))

	if err != nil {
		log.Println(err.Error())
		return err
	}

	return nil
}

func isLoggedIn(c *gin.Context, db *mongo.Database, ctx context.Context) (bool, *models.User) {
	var session models.Session
	var user models.User

	cookie, err := c.Cookie("session")

	if err != nil {
		log.Println(err.Error())
		return false, &models.User{}
	}

	err = db.Collection("sessions").FindOne(ctx, bson.D{{Key: "session-id", Value: cookie}}).Decode(&session)

	if err != nil {
		log.Println(err.Error())
		return false, &models.User{}
	}

	if session.Expires.Before(time.Now()) {
		c.SetCookie("session", "", -1, "/", c.Request.Host, false, true)
		db.Collection("sessions").DeleteMany(ctx, bson.D{{Key: "email", Value: session.Email}})
		return false, &models.User{}
	}

	err = db.Collection("users").FindOne(ctx, bson.D{{Key: "email", Value: session.Email}}).Decode(&user)

	if err != nil {
		log.Println(err.Error())
		return false, &models.User{}
	}
	user.Password = ""
	return true, &user
}
