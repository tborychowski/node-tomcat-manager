node-tomcat-manager
===================
nodejs-based simple command-line tomcat manager


Install
-------

	npm install node-tomcat-manager


Usage
-----
Make sure you have a user "tomcat" with password "tomcat" and manager roles assigned, in your tomcat-users.xml file, e.g.:

	<tomcat-users>
		<role rolename="manager-gui"/>
		<role rolename="manager-script"/>
		<user username="tomcat" password="tomcat" roles="manager-gui, manager-script"/>
	</tomcat-users>

If you have different username or password, please change it in the `tomcat.json` config.

**Usage:**

	tomcat [options] <func> <app>

	<func>			One of the below:
						list         show applications
						stop         stop an application or Tomcat server
						start        start an application or Tomcat server
						restart      restart an application
						undeploy     undeploy an application
						kill         stop and undeploy an application
	<app>			Application name

	-V, --verbose   show all output (e.g. "deploy" or "clean" from config)
	-a, --all       also show ignored applications (like /docs, /examples, /manager)
	-h, --help      display help & usage
	-v, --version   display cli name & version


Examples
--------
	tomcat list -a        :: show all deployed applications
	tomcat stop myApp     :: stop an application
	tomcat start          :: start tomcat server and exit (requires the tomcat.json config file)
	tomcat start -V       :: start tomcat server with log (requires the tomcat.json config file)



Config
------
You can also create a config file to manage undeployed apps! If you create `tomcat.json` in the same folder as script, e.g.:

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
					"clean" : "mvn clean"
				}
			}
		]
	}

With the above file `tomcat list` would also show you apps from config with possible functions you can use on them. You can then do:

	tomcat deploy MyTomcatApp



Tips
----

 - App and Func order doesn't matter, e.g. these are equivalent:

		tomcat stop myApp
		tomcat myApp stop

 - You don't have to put the whole name, partial matches are fine too! If you have app called "MyTomcatApp" you can do:

		tomcat start myapp
		tomcat start app    # provided you don't have another similar name containing "app"


 - Apps from config are managed using commmand line, so if commands you want to put there work in your console they should work here as well

License
-------

*MIT*
