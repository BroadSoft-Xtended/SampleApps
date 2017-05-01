# helloWorldHubAdvanced
A more complex version of a Hub Integration that works with private data. (IE: the app is set as a private app)

* A more basic version can be found here: https://github.com/BroadsoftLabs/helloWorldHubSimple

https://hello-world-hub-app.herokuapp.com/#/

# App Setup

## create your app

```
npm install
npm start
```

Check out your app running here:

https://localhost:8080/

## Push your app up to heroku

Follow this: https://blog.heroku.com/the_heroku_toolbelt

```
heroku create
git push heroku master
```

See your app running with `heroku open`
Check the logs with `heroku logs -t` if needed.

# Register your app in the sandbox

Create an account here: https://developer.broadsoftlabs.com/#/app/login

Then add a new hub app here: https://developer.broadsoftlabs.com/#/app/make The name you use matters as it will be used in all routes as :appName or :app

Check out the settings of your app here: https://developer.broadsoftlabs.com/#/app/appDashboard/hub/basicSettings. you can update the Application Url to any url you like if you want something other than your heroku URL. Then click save at the bottom.

Make sure to set your app as private in the developer portal app settings page.

# I have never used node and express

Have a look here: https://scotch.io/tutorials/build-a-restful-api-using-node-and-express-4
