node-tomcat-manager
===================
nodejs-based simple command-line tomcat manager


Usage
-----

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
