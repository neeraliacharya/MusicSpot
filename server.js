var express = require('express');
var app = express();
const fs1=require('fs')
var ejs = require('ejs');
var fs=require('fs')
var path = require('path')
const bodyParser = require("body-parser");
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var request = require('request');
var session = require('express-session');

/** bodyParser.urlencoded(options)
 * Parses the text as URL encoded data (which is how browsers tend to send form data from regular forms set to POST)
 * and exposes the resulting object (containing the keys and values) on req.body
 */

app.use(session({ secret: 'this_is_secret' }) );
// var sess;

var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
  
var stateKey = 'spotify_auth_state';

app.use(bodyParser.urlencoded({
    extended: true
}));

/**bodyParser.json(options)
 * Parses the text as JSON and exposes the resulting object on req.body.
 */
app.use(bodyParser.json());

// app.post("/", function (req, res) {
//     console.log(req.body.code)
// });
app.use(express.static(path.join('public'))); //making public directory as static diectory
app.use(express.static('src/views')); //making public directory as static diectory   
app.use(cookieParser());

app.set('views', './src/views');  
app.set('view engine', 'ejs');  

app.get('/', function(req, res) { 
    res.render('index', {  
        title: 'Web Application using Node.js',  
        heading: 'Hello C# Corner, Welcome to Node.js Tutorial',  
        foodItems: ['Pizza', 'Burger', 'Pasta']  
    });      
    // res.writeHead(200, {'Content-Type': 'text/html'});
});

app.get('/user_account', function(req, res) {
    var engine = require('consolidate');
    app.set('views', './src/views');  
    app.engine('html', engine.mustache);
    app.set('view engine', 'html');
    res.render('user_account.html')
});

app.get('/login', function(req,res) {
    app.use(session({ secret: 'this_is_secret' }) );
    if(req.session.access_token)
        res.redirect('/profile')
    app.set('views', './src/views');  
    app.set('view engine', 'ejs');  
    if(req.query.login)
        res.redirect('/login_script')
    res.render('login')

})

app.get('/logout', function(req,res) {
    app.set('views', './src/views');  
    app.set('view engine', 'ejs'); 
    app.use(session({ secret: 'this_is_secret' }) );
    req.session.destroy();
    res.render('login');

})

app.get('/login_script', function(req, res) {
    
    var state = generateRandomString(16);
    var my_client_id='c09cb0de376b4df793da8a380b78de95'
    res.cookie(stateKey, state);
    var redirect_uri = 'http://localhost:3001/account'



    // your application requests authorization
    var scope = 'user-read-private user-read-email';
    res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
        response_type: 'code',
        client_id: my_client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
    }));

});

var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

app.get('/signup', function(req, res) { 

    var my_client_id='c09cb0de376b4df793da8a380b78de95'
    var scopes = 'user-read-currently-playing user-read-playback-state user-follow-read playlist-read-private playlist-read-collaborative user-read-recently-played user-read-private user-read-email user-library-read';
    var redirect_uri = 'http://localhost:3001/account'

    var state = generateRandomString(16);
    res.cookie(stateKey, state);
    res.redirect('https://accounts.spotify.com/authorize' + '?response_type=code' +
        '&client_id=' + my_client_id +
        '&scope=' + scopes +
        '&redirect_uri=' + redirect_uri +
        '&state=' + state );
});

app.get('/account', function(req, res) { 

    app.use(session({ secret: 'this_is_secret' }) );

    var code = req.query.code || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    var my_client_id='c09cb0de376b4df793da8a380b78de95'
    var state = req.query.state || null;
    var redirect_uri = 'http://localhost:3001/account'
    var my_client_secret = '6fa8bfeca0554a3195f59af820d0739c'    

    console.log('Successful login');

    app.use(session({ secret: 'this_is_secret' }))

    var sess=req.session

    if (state === null || state !== storedState || sess.username) {
        res.redirect('/#' +
          querystring.stringify({
            error: 'state_mismatch'
          }));
      } else {

        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(my_client_id + ':' + my_client_secret).toString('base64'))
            },
            json: true
        };
        request.post(authOptions, function(error, response, body) {
          if (!error && response.statusCode === 200) {
    
            app.use(session({ secret: 'this_is_secret' }) );
            var sess=req.session
            sess.access_token = body.access_token   
            var access_token = body.access_token,
                refresh_token = body.refresh_token;
            
            sess.access_token=body.access_token
            sess.refresh_token=body.refresh_token
            const apiCall1 = () => {
                return new Promise((resolve, reject) => {
                  var options = {
                        url: 'https://api.spotify.com/v1/me',
                        headers: { 'Authorization': 'Bearer ' + access_token },
                        json: true
                  };
                  request.get(options, function(error, res, body) {
                        if(error) reject(error);
                        // console.log(body);
                        resolve(body);
                  });
                });
    
            }
  
            apiCall1().then((body) => {
                app.use(session({ secret: 'this_is_secret' }) );
                var sess=req.session
                newFunction(req, body);
                

                if(sess.username) {
                    console.log("Session stored: 201")
                    console.log(sess.username)
                } else {
                    console.log("Session not stored: 204")
                }
                app.use(session({ secret: 'this_is_secret' }) );
                        var sess=req.session
                        
                var values = [
                    { title: 'Username:', value: body.display_name},
                    { title: 'Email id:', value: body.email},
                    { title: "Country:", value: body.country},
                    { title: 'No of followers:', value: body.followers.total},
                ]

                res.render('user_account', {
                    page: 'profile',
                    profile_pic_url: body.images,
                    user_name: body.display_name,
                    values: values,
                    spotify_url: body.external_urls.spotify
                })
            }).catch((err) => console.log(err));
        }   else {
            res.redirect('/#' +
              querystring.stringify({
                error: 'invalid_token'
              }));
            }
        });
    }

});

app.get('/current_track', function(req, res) {

    app.use(session({ secret: 'this_is_secret' }) );
    if(!req.session.access_token)
        res.redirect('/login')

    const apiCall1_sub = () => {
        return new Promise((resolve1, reject1) => {
            app.use(session({ secret: 'this_is_secret' }) );
            var sess=req.session
            access_token = sess.access_token

            var options1_sub = {
                    url: 'https://api.spotify.com/v1/me/player/currently-playing',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true
            };
            request.get(options1_sub, function(error1, res1, body1) {
                    if(error1) reject1(error1);
                    console.log(body1);
                    resolve1(body1);
                });
        });
    }
    apiCall1_sub().then((body1) => {
        app.use(session({ secret: 'this_is_secret' }) );
        var sess=req.session
        console.log("+++++++++++++++++++++current playlist------------------------------")
        // sess.playing_song='false'
        
        try {
            sess.current_track=body1.context.external_urls.spotify
            sess.currently_playing=body1.is_playing
            sess.album_name=body1.item.name
            sess.album_image=body1.item.album.images[0].url
            sess.playing_song='true'
        }
        catch(err) {
            sess.playing_song='true'
            // res.render('user_account', {
            //     page: 'current_track',
            //     profile_pic_url: sess.profile_pic_link,
            //     user_name: sess.username,
            //     playing_song: 'false'
            // })            
        }
        
        if( sess.playing_song === 'false' ) {
            // sess.playing_song='false'
            console.log('not palying song!!!!!!!!!!!!')
            res.render('user_account', {
                page: 'current_track',
                profile_pic_url: sess.profile_pic_link,
                user_name: sess.username,
                playing_song: 'false',
                current_track: sess.current_track,
                currently_playing: ''+ sess.currently_playing,
                album_name: sess.album_name,
                album_image: sess.album_image
            })

        }
        else { 
            // sess.playing_song='true'
            console.log('palying song################')
            res.render('user_account', {
                page: 'current_track',
                profile_pic_url: sess.profile_pic_link,
                user_name: sess.username,
                playing_song: 'true',
                current_track: sess.current_track,
                currently_playing: ''+ sess.currently_playing,
                album_image: sess.album_image,
                album_name: sess.album_name
            })
    }
        console.log(sess.current_track)
        console.log(sess.currently_playing)

 
        // res.render('user_account', {
        //     page: 'current_track',
        //     profile_pic_url: sess.profile_pic_link,
        //     user_name: sess.username,
        //     current_track: sess.current_track,
        //     currently_playing: ''+ sess.currently_playing,
        //     album_name: sess.album_name,
        // })

    });              
});
app.get('/profile', function(req, res) { 
    app.use(session({ secret: 'this_is_secret' }) );
    if(!req.session.access_token)
        res.redirect('/login')

    app.use(session({ secret: 'this_is_secret' }) );
    var sess=req.session
    var access_token = sess.access_token,
        refresh_token = sess.refresh_token;

    const apiCall1 = () => {
        return new Promise((resolve, reject) => {
          var options = {
                url: 'https://api.spotify.com/v1/me',
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true
          };
          request.get(options, function(error, res, body) {
                if(error) reject(error);
                console.log(body);
                resolve(body);
          });
        });

    }
    apiCall1().then((body) => {
        var values = [
            { title: 'Username:', value: body.display_name},
            { title: 'Email id:', value: body.email},
            { title: "Country:", value: body.country},
            { title: 'No of followers:', value: body.followers.total},
        ]
        app.use(session({ secret: 'this_is_secret' }) );
        var sess=req.session
        newFunction(req, body);
        if(sess.username) {
            console.log("Session stored: 201")
            console.log(sess.username)
        } else {
            console.log("Session not stored: 204")
        }
        res.render('user_account', {
            page: 'profile',
            profile_pic_url: body.images,
            user_name: body.display_name,
            values: values,
            spotify_url: body.external_urls.spotify
        })
    }).catch((err) => console.log(err));
});

app.get('/albums', function(req, res) { 
    app.use(session({ secret: 'this_is_secret' }) );
    if(!req.session.access_token)
        res.redirect('/login')

        const apiCall2 = () => {
        return new Promise((resolve, reject) => {
            app.use(session({ secret: 'this_is_secret' }) );
            var sess=req.session
            access_token = sess.access_token
            console.log("Accesstoken for playlists: 327")   
            console.log(access_token)   
                                   
            var options2 = {
                url: 'https://api.spotify.com/v1/me/albums?offset=0',
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true,
            };
            request.get(options2, function(error, res, body) {
                if(error) reject(error);
                console.log("-------------------------Albums---------------------")
                console.log(res.body.items);
                resolve(body);
            });
        });

    }
    apiCall2().then((body) => {
        app.use(session({ secret: 'this_is_secret' }) );
        var sess=req.session

        var values = []
        for( var i=0; i<body.items.length; i++) {
            values.push(
                {   album_name : ''+body.items[i].album.name,
                    album_url : ''+body.items[i].album.external_urls.spotify,
                    album_image : ''+body.items[i].album.images[0].url,
                    artist_name : ''+body.items[i].album.artists[0].name || null,
                    artist_url : ''+body.items[i].album.artists[0].external_urls.spotify, 
                    album_total_tracks : ''+body.items[i].album.total_tracks, 
                    album_id : ''+body.items[i].album.id 
                }
            )
        }
        console.log("..........................................")
        console.log(values)

        // var album_details;
        // for( var x in body.items) {
        //     album_details=[
        //         { title: "Album type:", value}
        //         { title: "Link: ", value}
        //         { title: "Link: ", value}
        //     ]
        // }
        res.render('user_account', {
            page: 'albums',
            profile_pic_url: sess.profile_pic_link,
            user_name: sess.username,
            values: values
        })
    }).catch((err) => console.log(err));
});

app.get('/album_detail', function(req, res) { 
    app.use(session({ secret: 'this_is_secret' }) );
    if(!req.session.access_token)
        res.redirect('/login')

    if(!req.query.id)
        res.redirect('/albums')

        const apiCall2 = () => {
        return new Promise((resolve, reject) => {
            app.use(session({ secret: 'this_is_secret' }) );
            var sess=req.session
            access_token = sess.access_token
            console.log("Accesstoken for playlists: 327")   
            console.log(access_token)   
                                   
            var options2 = {
                url: 'https://api.spotify.com/v1/albums/'+req.query.id+'/tracks',
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true,
            };
            request.get(options2, function(error, res, body) {
                if(error) reject(error);
                console.log("-------------------------Albums---------------------")
                console.log(res.body.items);
                resolve(body);
            });
        });

    }
    apiCall2().then((body) => {
        app.use(session({ secret: 'this_is_secret' }) );
        var sess=req.session

        var values = []
        for( var i=0; i<body.items.length; i++) {
            values.push(
                {   album_name : ''+body.items[i].name,
                    album_url : ''+body.items[i].external_urls.spotify,
                    track_number : ''+body.items[i].track_number,
                }
            )
        }
        console.log("..........................................")
        console.log(values)

        // var album_details;
        // for( var x in body.items) {
        //     album_details=[
        //         { title: "Album type:", value}
        //         { title: "Link: ", value}
        //         { title: "Link: ", value}
        //     ]
        // }
        res.render('user_account', {
            page: 'album_detail',
            profile_pic_url: sess.profile_pic_link,
            user_name: sess.username,
            values: values
        })
    }).catch((err) => console.log(err));
});

app.get('/playlists', function(req, res) { 

    app.use(session({ secret: 'this_is_secret' }) );
    if(!req.session.access_token)
        res.redirect('/login')

        const apiCall3 = () => {
            return new Promise((resolve, reject) => {
                app.use(session({ secret: 'this_is_secret' }) );
                var sess=req.session
                access_token = sess.access_token
                console.log("Accesstoken for playlists: 309")   
                console.log(access_token)   
                                    
                var options3 = {
                    url: 'https://api.spotify.com/v1/me/playlists?offset=0',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true,
                };
                request.get(options3, function(error, res, body) {
                    if(error) reject(error);
                    console.log("-------------------------Playlists---------------------")
                    console.log(body.items);
                    resolve(body);
                });
            });

        }
        apiCall3().then((body) => {
            app.use(session({ secret: 'this_is_secret' }) );
            var sess=req.session

            var values = []
            for( var i=0; i<body.items.length; i++) {
                values.push(
                    {   name : ''+body.items[i].name,
                        url : ''+body.items[i].external_urls.spotify,
                        total_tracks : ''+body.items[i].tracks.total,
                        playlist_cover_link : ''+body.items[i].images[0].url, 
                        playlist_id : ''+body.items[i].id 
                    }
                )
            }
            console.log("..........................................")
            console.log(values)
            // console.log(JSON.stringify(body.items))
            res.render('user_account', {
                page: 'playlists',
                profile_pic_url: sess.profile_pic_link,
                user_name: sess.username,
                values: values
            })
    }).catch((err) => console.log(err));
});


app.get('/playlist_detail', function(req, res) { 

    app.use(session({ secret: 'this_is_secret' }) );
    
    if(!req.session.access_token)
        res.redirect('/login')

    if(!req.query.id)
        res.redirect('/playlists')

    playlist_id=req.query.id;
    
        const apiCall3 = () => {
            return new Promise((resolve, reject) => {
                app.use(session({ secret: 'this_is_secret' }) );
                var sess=req.session
                access_token = sess.access_token
                console.log("Accesstoken for playlists: 309")   
                console.log(access_token)   
                                    
                var options3 = {
                    url: 'https://api.spotify.com/v1/playlists/'+playlist_id+'/tracks',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true,
                };
                request.get(options3, function(error, res, body) {
                    if(error) reject(error);
                    console.log("-------------------------Playlists---------------------")
                    console.log(body.items);
                    resolve(body);
                });
            });

        }
        apiCall3().then((body) => {
            app.use(session({ secret: 'this_is_secret' }) );
            var sess=req.session

            var values = []
            for( var i=0; i<body.items.length; i++) {
                values.push(
                    {   name : ''+body.items[i].track.name,
                        url : ''+body.items[i].track.external_urls.spotify,
                        total_tracks : ''+body.items[i].track.track_number,  //track_number
                        playlist_cover_link : ''+body.items[i].track.album.images[0].url, 
                    }
                )
            }
            console.log("..........................................")
            console.log(values)
            // console.log(JSON.stringify(body.items))
            res.render('user_account', {
                page: 'playlist_detail',
                profile_pic_url: sess.profile_pic_link,
                user_name: sess.username,
                values: values
            })
    }).catch((err) => console.log(err));
});

app.get('/following', function(req, res) { 

    app.use(session({ secret: 'this_is_secret' }) );
    if(!req.session.access_token)
        res.redirect('/login')

        const apiCall3 = () => {
        return new Promise((resolve, reject) => {
            app.use(session({ secret: 'this_is_secret' }) );
            var sess=req.session
            access_token = sess.access_token
            console.log("Accesstoken for playlists: 309")   
            console.log(access_token)   
                                
            var options3 = {
                url: 'https://api.spotify.com/v1/me/following?type=artist',
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true,
            };
            request.get(options3, function(error, res, body) {
                if(error) reject(error);
                console.log("-------------------------following---------------------")
                console.log(body.artists);
                resolve(body);
            });
        });

    }
    apiCall3().then((body) => {
        app.use(session({ secret: 'this_is_secret' }) );
        var sess=req.session

        var values = []
        for( var i=0; i<body.artists.items.length; i++) {
            values.push(
                {   artist_name : ''+body.artists.items[i].name,
                    artist_url : ''+body.artists.items[i].external_urls.spotify,
                    artist_profile_image : ''+body.artists.items[i].images[0].url,
                    artist_api_url : ''+body.artists.items[i].href
                }
            )
        }
        console.log("..........................................")
        console.log(values)
        // console.log(JSON.stringify(body.items))
        res.render('user_account', {
            page: 'following',
            profile_pic_url: sess.profile_pic_link,
            user_name: sess.username,
            values: values
        })
    }).catch((err) => console.log(err));
});

app.get('/followers', function(req, res) { 

    app.use(session({ secret: 'this_is_secret' }) );
    if(!req.session.access_token)
        res.redirect('/login')

    app.use(session({ secret: 'this_is_secret' }) );
    var sess=req.session
    var user_id=sess.username

        const apiCall3 = () => {
        return new Promise((resolve, reject) => {
            app.use(session({ secret: 'this_is_secret' }) );
            var sess=req.session
            access_token = sess.access_token
            console.log("Accesstoken for playlists: 309")   
            console.log(access_token)   
                                
            var options3 = {
                url: 'https://api.spotify.com/v1/users/'+user_id,
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true,
            };
            request.get(options3, function(error, res, body) {
                if(error) reject(error);
                console.log("-------------------------following---------------------")
                console.log(body.artists);
                resolve(body);
            });
        });

    }
    apiCall3().then((body) => {
        app.use(session({ secret: 'this_is_secret' }) );
        var sess=req.session

        var values = []
        for( var i=0; i<body.artists.items.length; i++) {
            values.push(
                {   artist_name : ''+body.artists.items[i].name,
                    artist_url : ''+body.artists.items[i].external_urls.spotify,
                    artist_profile_image : ''+body.artists.items[i].images[0].url,
                    artist_api_url : ''+body.artists.items[i].href
                }
            )
        }
        console.log("..........................................")
        console.log(values)
        // console.log(JSON.stringify(body.items)) 
        res.render('user_account', {
            page: 'following',
            profile_pic_url: sess.profile_pic_link,
            user_name: sess.username,
            values: values
        })
    }).catch((err) => console.log(err));
});

app.get('/get_user_playlist', function(req, res) {

    app.use(session({ secret: 'this_is_secret' }) );
    if(!req.session.access_token)
        res.redirect('/login')

        console.log("************************get_user_playlist*********************")
    console.log(req.query.api_endpoint_url)
    const apiCall3 = () => {
        return new Promise((resolve, reject) => {
            app.use(session({ secret: 'this_is_secret' }) );
            var sess=req.session
            access_token = sess.access_token
            console.log("Accesstoken for playlists: 309")   
            console.log(access_token)   
                                
            var options3 = {
                url: req.query.api_endpoint_url,
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true,
            };
            request.get(options3, function(error, res, body) {
                if(error) reject(error);
                console.log("-------------------------get playlist---------------------")
                resolve(body);
            });
        });

    }
    apiCall3().then((body) => {
        app.use(session({ secret: 'this_is_secret' }) );
        var sess=req.session
        console.log(body.id)

        const apiCall3 = () => {
            return new Promise((resolve, reject) => {
                app.use(session({ secret: 'this_is_secret' }) );
                var sess=req.session
                access_token = sess.access_token
                console.log("Accesstoken for playlists: 309")   
                console.log(access_token)   
                                    
                var options3 = {
                    url: 'https://api.spotify.com/v1/users/'+body.id+'/playlists?offet=0',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true,
                };
                request.get(options3, function(error, res, body) {
                    if(error) reject(error);
                    console.log("-------------------------Playlists^^^^^^^^^^^^^^^^^^^^^^^^")
                    console.log(body);
                    resolve(body);
                });
            });

        }
        apiCall3().then((body) => {
            app.use(session({ secret: 'this_is_secret' }) );
            var sess=req.session

            var values = []
            for( var i=0; i<body.items.length; i++) {
                values.push(
                    {   name : ''+body.items[i].name,
                        url : ''+body.items[i].external_urls.spotify,
                        total_tracks : ''+body.items[i].tracks.total,
                        playlist_cover_link : ''+body.items[i].images[0].url 
                    }
                )
            }
            console.log("..........................................")
            console.log(values)
            // console.log(JSON.stringify(body.items))
            res.render('user_account', {
                page: 'playlists',
                profile_pic_url: sess.profile_pic_link,
                user_name: sess.username,
                values: values
            })
    }).catch((err) => console.log(err));

        var values = []
        // for( var i=0; i<body.artists.items.length; i++) {
        //     values.push(
        //         {   artist_name : ''+body.artists.items[i].name,
        //             artist_url : ''+body.artists.items[i].external_urls.spotify,
        //             artist_profile_image : ''+body.artists.items[i].images[0].url,
        //             artist_api_url : ''+body.artists.items[i].href
        //         }
        //     )
        // }
        // console.log("..........................................")
        // console.log(values)
        // // console.log(JSON.stringify(body.items))
        // res.render('user_account', {
        //     page: 'playlists',
        //     param: 'user',
        //     profile_pic_url: sess.profile_pic_link,
        //     user_name: sess.username,
        //     values: values
        // })
    }).catch((err) => console.log(err));
})

app.get('/users', function(req, res) {
    console.log('http://127.0.0.1/users');
    fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
        console.log( data );
        // res.send( data );
    });
});

app.get('/database_connection', function(req, res) {
    console.log('http://127.0.0.1/database_connection');
    // Retrieve
    var MongoClient = require('mongodb').MongoClient;
    
    // Connect to the db
    MongoClient.connect("mongodb://localhost:27017/test", { useNewUrlParser: true }, function (err, client) {
       
        if(err) throw err;
        console.log("Connected successfully to server");
        
        var database = client.db('test')
        // client.collection('new');
        database.collection('new' ).find().toArray(function(err, result) {
            if(err) throw err;
            console.log(result);
            res.send(result)
        })
        database.collection('new').save({"_id": 1, "c": 1})

         
         //  res.send("Connected successfully");

    
        //  res.send(db.test.find())
        
        
         //Write databse Insert/Update/Query code here..
                    
    });
});

app.listen(3001, function() {
    console.log("Server is running at 3001 port!");
    // var host = server.address().address
    // var port = server.address().port

    // console.log("Example app listening at http://%s:%s", host, port)
});

function newFunction(req, body) {
    sess = req.session;
    sess.username = body.display_name;
    sess.email_id = body.email;
    sess.country=body.country;
    sess.spotify_url=body.external_urls.spotify;
    sess.no_of_followers=body.followers.total;
    sess.followers=body.followers.href;
    sess.profile_pic_link=body.images;
}
function newFunction2(req, body) {
    // sess = req.session;
    // sess.username = body.display_name;
    // sess.email_id = body.email;
    // sess.country=body.country;
    // sess.spotify_url=body.external_urls.spotify;
    // sess.no_of_followers=body.followers.total;
    // sess.followers=body.followers.href;
    // sess.profile_pic_link=body.images;
}