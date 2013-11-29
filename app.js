/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var request = require("request");
var cheerio = require("cheerio");
var io = require('socket.io');

var app = express();

// all environments
app.set('port', process.env.PORT || 3002);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

server = http.createServer(app).listen(app.get('port'));
io=io.listen(server);

io.sockets.on('connection',function(socket){fetchNews(socket)});
//
setInterval(function(){
     io.sockets.on('connection',function(socket){fetchNews(socket)})
},600000);

function fetchNews(socket)
{
    socket.on('fetchnews',function(data){
        request({
            uri: "http://www.indianexpress.com/",
        }, function(error, response, body) {
            var $ = cheerio.load(body);
            var parent = $('#leftcol');

            var news = '';
            var news_array=Array();

            obj=new Object();
            obj.news_title = parent.find('h1').find('a').text();
            obj.news_link = parent.find('h1').find('a').attr('href');
            obj.news_image = parent.find('a').find('img').attr('src');
            obj.news_source = 'indianexpress';
            news_array.push(obj);
            i=0;
            parent.find('h3').each(function(){
                if(i<7)
                {
                    obj=new Object();
                    obj.news_title = $(this).find('a').text();
                    obj.news_link = $(this).find('a').attr('href');
                    obj.news_image = $(this).next('a').find('img').data('original');
                    // obj.news_content = $(this).nodeValue;
                    //console.log($(this).next('a').after());
                    obj.news_source = 'indianexpress';
                    news_array.push(obj);
                }
                i++;
            })

            io.sockets.emit('latestnews',news_array);
        });


        //socket.broadcast.emit('newmessage',data);
    })
}