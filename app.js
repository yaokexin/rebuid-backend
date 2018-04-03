var http = require('http');
var server = http.createServer();
var fs = require('fs');
var path = require('path');
var querystring = require('querystring');
var util = require('util');


var userlist = [{
    phoneNumber:17602197317,
    code:123456
}]
server.on('request',function(request,response){
    // var userlist;
    response.writeHead(200,'ok',{
        'Content-Type': 'application/json;charset=utf-8',
        'Access-Control-Allow-Origin':'*',
        'Access-Control-Allow-Headers':'Origin, X-Requested-With, Content-Type, Accept',
        'Access-Control-Allow-Methods':'PUT,POST,GET,DELETE,OPTIONS'
    })
    if(request.url == '/'){
        response.write('<h1>这里是首页</h1>');
        request.on('data',function(chunk){
            post+=chunk;
        });
        request.on('end',function(){
            post = querystring.parse(post);
            response.end(util.inspect(post));
        })
    }else if(request.url == '/login'){
        getPostBody(request,function(queryObject){
            console.log(queryObject);
            for(var k in queryObject){
                var paramObject = JSON.parse(k);
                if(paramObject !={}){
                   
                        // console.log(userlist);
                        var paramObject = JSON.parse(k);
                        var valueArray = ["phoneNumber", "code"];
                        for (var prop in paramObject) {
                            if (valueArray.indexOf(prop) == -1) {
                                console.log(222);
                                response.end('{"responseCode":1,"responseMeage":"参数有误"}');
                                return ;
                            }
                        }

                        // readNewsData(function (newarr) {
                        // var userlist = newarr;
                        for (let i = 0; i < userlist.length; i++) {
                            console.log(paramObject.phoneNumber);
                            console.log(userlist[i].phoneNumber)
                            if (paramObject.phoneNumber == userlist[i].phoneNumber) {
                                console.log(111);
                                // response.end("{responseCode:0,responseMeage:'用户注册了'}");
                                if (paramObject.code == userlist[i].code) {
                                   response.write('{"responseCode":0,"responseMeage":"成功登录"}');
                                } else {
                                    response.end('{"responseCode":1,"responseMeage":"密码错误"}');
                                }
                            } else {
                                // userlist.push(paramObject);
                                // console.log(userlist);
                                // var newUser={};
                                // for(var k in paramObject){
                                //     newUser[k]=paramObject[k]
                                // }
                                // userlist.push(newUser);
                                // console.log(userlist);
                                response.write('{"responseCode":1,"responseMeage":"用户未注册"}')
                            }
                        }
                    // })
                }else{
                    response.end();       
                }
             
            }
            response.end();       
        })
       
    }else{
        response.writeHead(404,"NOT FOUND",{
            'Content-Type':'text/html;charset=utf-8' 
        }),
        response.write("<h1>这个页面丢了！！</h1>")
    }
});

server.listen("8080",function(){
    console.log("服务器已经开启,监听端口在8080,请访问:http://localhost:8080");
})

// 获取post 过来的数据
function getPostBody(req, callback) {
    var result = [];
    req.on("data", function (chunk) {
        result.push(chunk);
    })
    req.on("end", function () {
        //当所有的数据传输完毕的时候，end事件会被触发
        //我们要在传输完毕的时候，将所有的数据buffer拼接起来
        //再将其转成我们需要的数据

        //1. 拼接Buffer
        result = Buffer.concat(result);

        //2. 将拼接好的Buffer转成正常的数据
        result = result.toString("utf8");

        //3. 获取到的result数据，其实就是 key=value&key=value字符串
        //我们需要将其转成对应的对象(借助node中的querystring)
        result = querystring.parse(result);
        //将最终获取到的post请求的数据对象 传递给callback
        //用户想要做任何处理，只需要在callback中执行自己的操作，书写自己的代码即可
        callback(result);
    })
}


//读取必要的数据
function readNewsData(callback) {
    var newsList;
    fs.readFile(path.join(__dirname, "data.json"), "utf8", function (err, data) {
        if (err) {
            newsList = [];
        } else {
            newsList = JSON.parse(data);
        }
        callback(newsList);
    })
}