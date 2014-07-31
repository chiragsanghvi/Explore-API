// Load Http library
var sys = require('sys'),
    url = require('url'),
    restify = require('restify'),
	Appacitive = require('appacitive');

Appacitive.initialize({ 
  apikey: "Ycoku70GRMEG0twcjxHJ7qjib4jsxcFPr8P47A51UFI=",// The master or client api key for your app on appacitive.
  env: "live",      // The environment that you are targetting (sandbox or live).
  appId: "20892347345798035"     // The app id for your app on appacitive. 
});

Appacitive.config.apiBaseUrl = "http://apis.appacitive.com/v1.0/"

var Location = Appacitive.Object.extend('location', {
	getDetails: function() {

	}
});

var setCorsHeaders = function(res) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
};

var getDomain = function(res) {
	
  // Create a domain for exception handling
  var domain = require('domain').create();

  domain.on('error', function(err) {
  	try {
  		if (!res.headersSent) {
		  	res.writeHead(500, { 'Content-Type': 'application/json'});
			res.end(JSON.stringify({ message: "Server Error" }));
		}
	} catch(e) {}

    sys.puts("Error "  + err.message + '\n' + err.stack);
    domain.dispose();
  });

  return domain;

};

var server = restify.createServer();
server.use(restify.acceptParser(server.acceptable));
//server.pre(restify.CORS( { origins: ['GET', 'POST', 'OPTIONS']}) );
//server.use(restify.fullResponse());
server.use(restify.queryParser({ mapParams: false }));
server.use(restify.gzipResponse());
server.use(restify.bodyParser({ mapParams: false, rejectUnknown: false }));

server.get('/locations', function (req, res, next) {
	// Set CORS headers
	setCorsHeaders(res);

	var domain = getDomain(res);

	domain.run(function() {

		var query = req.query;

		var radius = 2;

		if (query.rad) radius = query.rad;

		//create Appacitive.GeoCoord object
		var center = new Appacitive.GeoCoord(query.lat, query.lng);

		//create filter
		var radialFilter = Appacitive.Filter.Property('location').withinCircle(center, radius, 'km');

		//create query object
		var findQuery = Location.findAllQuery({
			filter: radialFilter,
			pageSize: query.psize || 200,
			pageNumber: query.pnum || 1,
			orderBy: '__id',
			fields: ['__id', 'address', 'category', 'city', 'contact', 'country', 'description', 'images', 'location', 'name', 'street', 'country'], 
		});

		if (query.q) findQuery.freeText(query.q);
		
		findQuery.fetch().then(function(locations, pi) {
			res.setHeader('Content-Type', 'application/json');
			res.send(200, { location: locations, pi: pi });
		}, function(err) {
			res.setHeader('Content-Type', 'application/json');
			err.locations = null;
			res.send(400, err);
		});

	});
});

server.listen(8095, function () {
    console.log('Explore server listening at %s', server.url);
});
