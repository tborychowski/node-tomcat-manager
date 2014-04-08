node-tomcat-manager
===================
nodejs-based simple command-line tomcat manager


Install
-------

```bash
npm install node-tomcat-manager
```


Usage
-----
Make sure you have a user "tomcat" with password "tomcat" and manager roles assigned, in your `tomcat-users.xml` file, e.g.:

```xml
<tomcat-users>
	<role rolename="manager-gui"/>
	<role rolename="manager-script"/>
	<user username="tomcat" password="tomcat" roles="manager-gui, manager-script"/>
</tomcat-users>
```

If you have different username or password, please change it in the `tomcat.json` [config](#config).

**Usage:**

```bash
tomcat [options] <func> <app>

<func>			One of the below:
                   list         show applications
                   stop         stop an application
                   start        start an application
                   restart      restart an application
                   undeploy     undeploy an application
                   kill         stop -> undeploy

                   deploy       deploy app to the server
                   clean        clean-up the build folders
                   delete       remove the app folder from the server
                   redeploy     stop -> undeploy -> clean -> deploy

<app>			Application name

-V, --verbose   show all output (e.g. "deploy" or "clean" from config)
-a, --all       also show ignored applications (like /docs, /examples, /manager)
-h, --help      display help & usage
-v, --version   display cli name & version
```

Examples
--------
```bash
tomcat list -a        # show all deployed applications
tomcat stop myApp     # stop an application
tomcat myApp kill     # stop and undeploy an app
```



Config
------
You need a config file to manage undeployed apps. Create a `tomcat.json` file in the same folder as script:

```json
{
	"tomcat": {
		"loginpass": "tomcat:tomcat",
		"path": "D:\\apache-tomcat-7.0.32\\bin"
	},

	"apps": [
		{
			"name": "MyTomcatApp",
			"path": "D:\\Projects\\MyTomcatApp",
			"actions" : {
				"deploy" : "mvn tomcat:redeploy",
				"clean" : "mvn clean",
				"delete" : "rm -r D:\\apache-tomcat-7.0.32\\webapps\\MyTomcatApp"
			}
		}
	]
}
```

With the above file `tomcat list` would also show you apps from config. You can then do:

```bash
tomcat deploy MyTomcatApp
tomcat MyTomcatApp redeploy
```



Tips
----

 - App and Func order doesn't matter, e.g. these are equivalent:

```bash
tomcat stop myApp
tomcat myApp stop
```

 - You don't have to put the whole name, partial matches are fine too! If you have app called "MyTomcatApp" you can do:

```bash
tomcat start myapp
tomcat start app    # provided you don't have another similar name containing "app"
```


 - Apps from config are managed using commmand line, so if commands you want to put there work in your console they should work here as well

License
-------

*MIT*
