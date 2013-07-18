var http = require('http'),
	urlCfg = {
		hostname: 'localhost',
		port: 8080,
		path: '/manager/text',
		headers : { 'Authorization' : 'Basic ' + new Buffer('tomcat:tomcat').toString('base64') }
	},
	get = function (path, cb) {
		urlCfg.path = '/manager/text/' + path;
		http.request(urlCfg, function (res) {
			var resp = '';
			res.on('data', function (chunk) { resp += chunk; });
			res.on('end', function () { cb(resp); });
		}).on('error', function (e) { console.log('Error: ' + e.message); }).end();
	},
	spaces = function (i, ch) { if (i < 0) return ''; return new Array(i || 1).join(ch || ' '); },
	ver = function () { console.log('Tomcat Manager v1.0'); },
	help = function () {
		console.log('Usage: tomcat [function] [arguments]');
		console.log('\nFunction');
		console.log(' list\t\tshow applications');
		console.log(' stop\t\tstop an application');
		console.log(' start\t\tstart an application');
		console.log(' undeploy\tundeploy an application');
		console.log(' kill\t\tstop and undeploy an application');
		console.log('\nArguments');
		console.log(' -v\t\tshow script version');
		console.log(' -h\t\tshow script help');
		console.log(' -all\t\tshow all applications (if used with "list")');
		console.log(' [app name]\tdo something with that app');
	},	
	printList = function (apps) {
		var lenApp = 1, lenStat = 7, lenSess = 8, lenPath = 1, str;
		apps.forEach(function (app) {
			lenApp = Math.max(lenApp, app.name.length);
			lenStat = Math.max(lenStat, app.status.length);
			lenSess = Math.max(lenSess, (app.sessions + '').length);
			lenPath = Math.max(lenPath, app.path.length);
		});
		lenApp += 5;
		lenStat ++;
		lenSess ++;
		lenPath += 5;
		console.log('Path' + spaces(lenPath - 4) + ' Status' + spaces(lenStat - 6) + ' Sessions');
		console.log(spaces(lenPath, '-') + ' ' + spaces(lenStat, '-') + ' ' + spaces(lenSess, '-'));
		apps.forEach(function (app) {
			str = app.path + spaces(lenPath - app.path.length) + ' ';
			str += app.status + spaces(lenStat - app.status.length) + ' ';
			str += app.sessions + spaces(lenSess - ('' + app.sessions).length);
			console.log(str);
		});
	},
	
	run = {
		list : function (app, param) {
			var apps = [], showAll = (param === '-all'), ignoredApps = [ 'ROOT', 'manager', 'docs', 'examples', 'host-manager' ];
			get('list', function (resp) {
				resp.split('\n').forEach(function (line) {
					if (line.indexOf('OK - Listed applications') === 0) return;
					line = line.trim();
					if (!line.length) return;
					line = line.split(':');
					if (ignoredApps.indexOf(line[3]) > -1 && !showAll && !app) return;
					if (typeof app !== 'undefined' && line[3] !== app) return;
					apps.push({ name: line[3], status: line[1], path: line[0], sessions: line[2] });
				});
				printList(apps);
			});
		},
		stop : function (app, param) { get('stop?path=/' + app, function (resp) { console.log(resp); }); },
		start : function (app, param) { get('start?path=/' + app, function (resp) { console.log(resp); }); },
		undeploy : function (app, param) { get('undeploy?path=/' + app, function (resp) { console.log(resp); }); },
		kill : function (app) {	// stop & undeploy
			get('stop?path=/' + app, function (resp) {
				console.log(resp);
				get('undeploy?path=/' + app, function (resp) { console.log(resp); });
			});
		},
	};

var fn, app, param, i = 2, p, fnList = Object.keys(run);
for (; p = process.argv[i++] ;) {
	if (fnList.indexOf(p) > -1) fn = p;
	else if (p.indexOf('-') === 0) param = p;
	else app = p;
}

if (param === '-v') ver();
else if (typeof run[fn] === 'function') run[fn](app, param);
else help();
