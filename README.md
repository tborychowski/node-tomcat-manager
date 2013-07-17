node-tomcat-manager
===================
nodejs-based simple command-line tomcat manager


Usage
-----
Make sure you have a user "tomcat" with password "tomcat" and manager roles assigned, in your tomcat-users.xml file, e.g.:

	<tomcat-users>
		<role rolename="manager-gui"/>
		<role rolename="manager-script"/>
		<user username="tomcat" password="tomcat" roles="manager-gui, manager-script"/>
	</tomcat-users>

Usage:
	
    tomcat [function] [arguments]

	Function
	 list           show applications
	 stop           stop an application
	 start          start an application
	 undeploy       undeploy an application
	 kill           stop and undeploy an application

	Arguments
	 -v             show script version
	 -h             show script help
	 -all           show all applications (if used with "list")
	 [app name]     do something with that app


Examples
--------

	tomcat list -all      :: show all deployed applications
	tomcat stop myApp     :: stop an application
	

License
-------

*MIT*
