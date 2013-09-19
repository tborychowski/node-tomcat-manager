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

Usage:
	
    tomcat [options] <func> <app>
	
    <func>          One of the below:
                       list         show applications
                       stop         stop an application
                       start        start an application
                       restart      restart an application
                       undeploy     undeploy an application
                       kill         stop and undeploy an application
    <app>           Application name

    -a, --all       also show ignored applications (like /docs, /examples, /manager)
    -h, --help      display help & usage
    -v, --version   display cli name & version


Examples
--------
	tomcat list -a        :: show all deployed applications
	tomcat stop myApp     :: stop an application
	

License
-------

*MIT*
