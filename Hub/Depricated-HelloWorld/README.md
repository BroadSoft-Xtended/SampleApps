# Hello World
This app will get you set up so you can display MicroApps, Contextual and Notifications in Hub.

It is hosted here: https://shrouded-mountain-76886.herokuapp.com/

# App Setup

## Create your app

```
git clone https://github.com/BroadSoft-Xtended/SampleApps.git && cd hub/helloWorld
npm install
npm start
```

Check out your app running here:

https://localhost:8080/

## Push your app up to heroku

Follow this: https://blog.heroku.com/the_heroku_toolbelt

```
rm -rf .git
git init && git add . && git commit -m 'init'
heroku create
git push heroku master
```

See your app running with `heroku open`
Check the logs with `heroku logs -t` if needed.

To push an update to heroku:

```
git add . && git commit -m 'my new changes'
git push heroku master
```

# Register your app in the dev portal

Create an account here: https://developer.broadsoftlabs.com/#/app/login

Then add a new hub app here: https://developer.broadsoftlabs.com/#/app/make The name you use can matter as it will be used in all routes as :appName or :app. The application url should be the url that heroku gave you in the terminal once it had built your app. It is also the url you get when you do `heroku open` in the terminal.

Check out the settings of your app by selecting it from the make page. You can update the Application Url to any url you want other than your heroku URL. Then click save at the bottom.

# I have never used node and express

Have a look here: https://scotch.io/tutorials/build-a-restful-api-using-node-and-express-4
