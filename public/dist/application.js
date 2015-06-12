'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
	// Init module configuration options
	var applicationModuleName = 'dapper-dingos';
	var applicationModuleVendorDependencies = ['ngResource', 
		'ngCookies',
		'ngAnimate',
		'ngTouch',
		'ngSanitize',
		'ui.router',
		'ui.bootstrap',
		'ui.utils'];

	// Add a new vertical module
	var registerModule = function(moduleName, dependencies) {
		// Create angular module
		angular.module(moduleName, dependencies || []);

		// Add the module to the AngularJS configuration file
		angular.module(applicationModuleName).requires.push(moduleName);
	};

	return {
		applicationModuleName: applicationModuleName,
		applicationModuleVendorDependencies: applicationModuleVendorDependencies,
		registerModule: registerModule
	};
})();
'use strict';

//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config(['$locationProvider',
	function($locationProvider) {
		$locationProvider.hashPrefix('!');
	}
]);

//Then define the init function for starting up the application
angular.element(document).ready(function() {
	//Fixing facebook bug with redirect
	if (window.location.hash === '#_=_') window.location.hash = '#!';

	//Then init the app
	angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});
'use strict';

// Use Application configuration module to register a new module
ApplicationConfiguration.registerModule('articles');

'use strict';

// Use Applicaion configuration module to register a new module
ApplicationConfiguration.registerModule('core');
'use strict';

// Use Application configuration module to register a new module
ApplicationConfiguration.registerModule('users');
'use strict';

// Configuring the Articles module
angular.module('articles').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Articles', 'articles', 'dropdown', '/articles(/create)?');
		Menus.addSubMenuItem('topbar', 'articles', 'List Articles', 'articles');
		Menus.addSubMenuItem('topbar', 'articles', 'New Article', 'articles/create');
	}
]);
'use strict';

// Setting up route
angular.module('articles').config(['$stateProvider',
	function($stateProvider) {
		// Articles state routing
		$stateProvider.
		state('listArticles', {
			url: '/articles',
			templateUrl: 'modules/articles/views/list-articles.client.view.html'
		}).
		state('createArticle', {
			url: '/articles/create',
			templateUrl: 'modules/articles/views/create-article.client.view.html'
		}).
		state('viewArticle', {
			url: '/articles/:articleId',
			templateUrl: 'modules/articles/views/view-article.client.view.html'
		}).
		state('editArticle', {
			url: '/articles/:articleId/edit',
			templateUrl: 'modules/articles/views/edit-article.client.view.html'
		});
	}
]);
'use strict';

// Articles controller
angular.module('articles').controller('ArticlesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Articles',
	function($scope, $stateParams, $location, Authentication, Articles) {
		$scope.authentication = Authentication;

		// Create new Article
		$scope.create = function() {
			// Create new Article object
			var article = new Articles({
				title: this.title,
				content: this.content
			});

			// Redirect after save
			article.$save(function(response) {
				$location.path('articles/' + response._id);

				// Clear form fields
				$scope.title = '';
				$scope.content = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Article
		$scope.remove = function(article) {
			if (article) {
				article.$remove();

				for (var i in $scope.articles) {
					if ($scope.articles[i] === article) {
						$scope.articles.splice(i, 1);
					}
				}
			} else {
				$scope.article.$remove(function() {
					$location.path('articles');
				});
			}
		};

		// Update existing Article
		$scope.update = function() {
			var article = $scope.article;

			article.$update(function() {
				$location.path('articles/' + article._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Articles
		$scope.find = function() {
			$scope.articles = Articles.query();
		};

		// Find existing Article
		$scope.findOne = function() {
			$scope.article = Articles.get({
				articleId: $stateParams.articleId
			});
		};
	}
]);
'use strict';

//Articles service used for communicating with the articles REST endpoints
angular.module('articles').factory('Articles', ['$resource',
	function($resource) {
		return $resource('articles/:articleId', {
			articleId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);
'use strict';

// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {
		// Redirect to home view when route not found
		$urlRouterProvider.otherwise('/');

		// Home state routing
		$stateProvider.
		state('home', {
			url: '/',
			templateUrl: 'modules/core/views/home.client.view.html'
		});
	}
])
// .run(['Menus',
// 	function(Menus) {
// 		// Set top bar menu items
// 		Menus.addMenuItem('topbar', 'Articles', 'articles', 'dropdown', '/articles(/create)?');
// 		Menus.addSubMenuItem('topbar', 'articles', 'List Articles', 'articles');
// 		Menus.addSubMenuItem('topbar', 'articles', 'New Article', 'articles/create');
// 	}
// ]);
// #DD calls the core app module
angular.module('core')
// #DD Establish functionality for pressing the enter key
.directive('ngEnter', function () {
	return function (scope, element, attrs) {
		element.bind("keypress", function (event) {
			if (event.which === 13) {
				scope.$apply(function () {
					scope.$eval(attrs.ngEnter);
				});
				event.preventDefault();
			}
		});
	};
})

// #DD develop method to post methods to server and DB
.factory('MessageFactory', ['$http', function ($http) {
	return {
		postMessage: function (message, callback) {
			console.log('Attempting Post');
			$http.post('/message', message)
			.success(function (data, status) {
				callback(data, false);
			}).
			error(function (data, status) {
				callback(data, true);
			});
		}
	};
}])

//#DD controller interface for user chat window, need to change userName to current authed user
.controller('chatController', ['$scope', 'Authentication', 'MessageFactory', function ($scope, Authentication, MessageFactory) {
	$scope.userName = Authentication.user;
	$scope.message = '';
	$scope.filterText = '';
	$scope.messages = [];

	var socket = io.connect();

    // #DD load previous messages from chat
  socket.on('pastMessages', function (data) {
  	console.log(data, 'past');
  	$scope.messages = data.reverse();
  	$scope.$apply();
  });



    //#DD using the local authentication as a condition, send a message to the server
  $scope.sendMessage = function () {
  	console.log("Send message event triggered");
  	var chatMessage = {
  		'username': $scope.userName.displayName,
  		'message': $scope.message
  	};
  	socket.emit('newMessage', chatMessage);
  	$scope.message = '';
  };
  socket.emit('getUsers');
}]);
'use strict';

// #DD This is necessary to keep the navigation bar on the top of the page workign

angular.module('core')
.controller('HeaderController', ['$scope', 'Authentication', 'Menus', function($scope, Authentication, Menus) {
		$scope.authentication = Authentication;
		$scope.isCollapsed = false;
		$scope.menu = Menus.getMenu('topbar');
		$scope.rooms = ['room1','room2','bigroom3','smallroom4'];
		$scope.room_search;
		$scope.video_search;
		$scope.video_search_focus = false;
		$scope.clearSearch = function(e){
			console.log('CLEAR SEARCH',e)
			$scope.video_search = "";
			$scope.video_results = "";

		}
		$scope.createRoom = function(roomName) {
			console.log('TODO: createRoom', roomName)
			$scope.rooms.push(roomName)
			$scope.room_search = '';
		}
		$scope.searchYouTube = function(e){
			console.log($scope.video_search)
			// If youtube exists in the string then emit event
			if ($scope.video_search.indexOf("youtube") > -1){
				var video_id = $scope.video_search.split('v=')[1];
				console.log(video_id, $scope.video_search)
					if(video_id.indexOf('&') !== -1) {
					var ampersandPosition = video_id.indexOf('&');
					  video_id = video_id.substring(0, ampersandPosition);
					} else {
					  video_id = video_id.substring(0, video_id.length);
					}
					
					var socket = io.connect();
					// #DD triggers url change via sockets, sends videoID as data
					socket.emit('changingUrl', video_id)
			}
			$scope.video_results = ['abc','123','456']
		}
		$scope.toggleCollapsibleMenu = function() {
			$scope.isCollapsed = !$scope.isCollapsed;
		};

		// Collapsing the menu after navigation
		$scope.$on('$stateChangeSuccess', function() {
			$scope.isCollapsed = false;
		});
	}
]);

'use strict';

// #DD Necessary for authentication (maybe)

angular.module('core').controller('HomeController', ['$scope', 'Authentication',
	function($scope, Authentication) {
		// This provides Authentication context.
		$scope.authentication = Authentication;
	}
]);

'use strict';

angular.module('core')

.controller('mainController', ['$scope', 'Menus', function($scope, Menus) {
		$scope.isCollapsed = false;
		$scope.menu = Menus.getMenu('topbar');

		$scope.ytQuery = '';

		//#DD input box function for taking the submitted string and parsing into a videoKey.
		$scope.ytSearcher = function(){

			var video_id = $scope.ytQuery.split('v=')[1];
			console.log(video_id, $scope.ytQuery)
				if(video_id.indexOf('&') !== -1) {
				var ampersandPosition = video_id.indexOf('&');
				  video_id = video_id.substring(0, ampersandPosition);
				} else {
				  video_id = video_id.substring(0, video_id.length);
				}
				
				var socket = io.connect();
				// #DD triggers url change via sockets, sends videoID as data
				socket.emit('changingUrl', video_id)
		}

	}])

//create youtube helper functions for sockets and functionality #DD
.factory('youtubeFactory', function(){
	return {

	    onPlayerStateChange: function(event){
	    	
	    	var socket = io.connect();
	    	
	// If player is Playing #DD
			if (event.data === 1 && !window.hold) {
				window.hold = true;
				console.log('Youtube object: ' + JSON.stringify(window.j))
				console.log(event)
				socket.emit('initiate', console.log('sending that its time to play!'));	
			}

	//If Player is paused #DD
			if (event.data === 2 && !window.hold) {
				window.hold = true;
				console.log('paused')
				socket.emit('paused', console.log('sending that video has been paused!'));
				}
			},

			onPlayerReady: function(event){
		   	console.log('player ready')
		}
	}
})

//create youtube directive/tag for HTML #DD, THIS IS THE MAGIC!
.directive('youtube', 
	["$window", "youtubeFactory", function($window, youtubeFactory) {
	  return {
	    restrict: "E",

	    scope: {
      		height:   "@",
      		width:    "@",
      		videoId:  "@"  
    	},

	    template: '<div></div>',

	    link: function(scope, element, attrs) {
	      window.j = attrs;
	      var tag = document.createElement('script');
	      tag.src = "https://www.youtube.com/iframe_api";
	      var firstScriptTag = document.getElementsByTagName('script')[0];
	      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

	      var player;
	      var socket = io.connect();

	      // #DD socket trigger for Starting Vid
	      socket.on('startVid', function(){
    			console.log('startingVid')
    			player.playVideo();
    			window.hold = false;
    			console.log('playing video')
 				});

	      // #DD socket trigger for Pausing Vid
	      socket.on('pauseVid', function(){
    			console.log('pausingVid')
    			player.pauseVideo();
    			window.hold = false;
    			console.log('stopping video')
 				});

	      // #DD socket trigger for Changing Videotime
 				socket.on('changeTime', function(newTime){
 					console.log('changingTime');
 					player.seekTo({seconds:newTime, allowSeekAhead:true})
 					window.hold = false;
 				})

	      // #DD socket trigger for changing URL
				socket.on('changeVid', function(urlKey){
					console.log('changing video Url')
					// #DDyoutube API function for cueing new video
					player.cueVideoByUrl({ mediaContentUrl: 'http://www.youtube.com/v/' + urlKey + '?version=5'})
					console.log('loading new Url')
				})

	      $window.onYouTubeIframeAPIReady = function() {
	        player = new YT.Player(element.children()[0], {

		        playerVars: {
	            autoplay: 0,
	            html5: 1,
	            theme: "light",
	            modesbranding: 0,
	            color: "white",
	            iv_load_policy: 3,
	            showinfo: 1,
          		controls: 1,
          		start: 0
         	  },
          	  height: scope.height,
              width: scope.width,
              videoId: 'AXwGVXD7qEQ',
              events: {
              	'onReady': youtubeFactory.onPlayerReady,
              	'onStateChange': youtubeFactory.onPlayerStateChange
              }
       		});
	      };
	    },  
	  }
	}]);


'use strict';

//Menu service used for managing  menus
angular.module('core').service('Menus', [

    function() {
        // Define a set of default roles
        this.defaultRoles = ['*'];

        // Define the menus object
        this.menus = {};

        // A private function for rendering decision 
        var shouldRender = function(user) {
            if (user) {
                if (!!~this.roles.indexOf('*')) {
                    return true;
                } else {
                    for (var userRoleIndex in user.roles) {
                        for (var roleIndex in this.roles) {
                            if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
                                return true;
                            }
                        }
                    }
                }
            } else {
                return this.isPublic;
            }

            return false;
        };

        // Validate menu existance
        this.validateMenuExistance = function(menuId) {
            if (menuId && menuId.length) {
                if (this.menus[menuId]) {
                    return true;
                } else {
                    throw new Error('Menu does not exists');
                }
            } else {
                throw new Error('MenuId was not provided');
            }

            return false;
        };

        // Get the menu object by menu id
        this.getMenu = function(menuId) {
            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Return the menu object
            return this.menus[menuId];
        };

        // Add new menu object by menu id
        this.addMenu = function(menuId, isPublic, roles) {
            // Create the new menu
            this.menus[menuId] = {
                isPublic: isPublic || false,
                roles: roles || this.defaultRoles,
                items: [],
                shouldRender: shouldRender
            };

            // Return the menu object
            return this.menus[menuId];
        };

        // Remove existing menu object by menu id
        this.removeMenu = function(menuId) {
            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Return the menu object
            delete this.menus[menuId];
        };

        // Add menu item object
        this.addMenuItem = function(menuId, menuItemTitle, menuItemURL, menuItemType, menuItemUIRoute, isPublic, roles, position) {
            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Push new menu item
            this.menus[menuId].items.push({
                title: menuItemTitle,
                link: menuItemURL,
                menuItemType: menuItemType || 'item',
                menuItemClass: menuItemType,
                uiRoute: menuItemUIRoute || ('/' + menuItemURL),
                isPublic: ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].isPublic : isPublic),
                roles: ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].roles : roles),
                position: position || 0,
                items: [],
                shouldRender: shouldRender
            });

            // Return the menu object
            return this.menus[menuId];
        };

        // Add submenu item object
        this.addSubMenuItem = function(menuId, rootMenuItemURL, menuItemTitle, menuItemURL, menuItemUIRoute, isPublic, roles, position) {
            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Search for menu item
            for (var itemIndex in this.menus[menuId].items) {
                if (this.menus[menuId].items[itemIndex].link === rootMenuItemURL) {
                    // Push new submenu item
                    this.menus[menuId].items[itemIndex].items.push({
                        title: menuItemTitle,
                        link: menuItemURL,
                        uiRoute: menuItemUIRoute || ('/' + menuItemURL),
                        isPublic: ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].items[itemIndex].isPublic : isPublic),
                        roles: ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].items[itemIndex].roles : roles),
                        position: position || 0,
                        shouldRender: shouldRender
                    });
                }
            }

            // Return the menu object
            return this.menus[menuId];
        };

        // Remove existing menu object by menu id
        this.removeMenuItem = function(menuId, menuItemURL) {
            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Search for menu item to remove
            for (var itemIndex in this.menus[menuId].items) {
                if (this.menus[menuId].items[itemIndex].link === menuItemURL) {
                    this.menus[menuId].items.splice(itemIndex, 1);
                }
            }

            // Return the menu object
            return this.menus[menuId];
        };

        // Remove existing menu object by menu id
        this.removeSubMenuItem = function(menuId, submenuItemURL) {
            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Search for menu item to remove
            for (var itemIndex in this.menus[menuId].items) {
                for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
                    if (this.menus[menuId].items[itemIndex].items[subitemIndex].link === submenuItemURL) {
                        this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
                    }
                }
            }

            // Return the menu object
            return this.menus[menuId];
        };

        //Adding the topbar menu
        this.addMenu('topbar');
    }
]);
'use strict';

// Config HTTP Error Handling
angular.module('users').config(['$httpProvider',
	function($httpProvider) {
		// Set the httpProvider "not authorized" interceptor
		$httpProvider.interceptors.push(['$q', '$location', 'Authentication',
			function($q, $location, Authentication) {
				return {
					responseError: function(rejection) {
						switch (rejection.status) {
							case 401:
								// Deauthenticate the global user
								Authentication.user = null;

								// Redirect to signin page
								$location.path('signin');
								break;
							case 403:
								// Add unauthorized behaviour 
								break;
						}

						return $q.reject(rejection);
					}
				};
			}
		]);
	}
]);
'use strict';

// Setting up route
angular.module('users').config(['$stateProvider',
	function($stateProvider) {
		// Users state routing
		$stateProvider.
		state('profile', {
			url: '/settings/profile',
			templateUrl: 'modules/users/views/settings/edit-profile.client.view.html'
		}).
		state('password', {
			url: '/settings/password',
			templateUrl: 'modules/users/views/settings/change-password.client.view.html'
		}).
		state('accounts', {
			url: '/settings/accounts',
			templateUrl: 'modules/users/views/settings/social-accounts.client.view.html'
		}).
		state('signup', {
			url: '/signup',
			templateUrl: 'modules/users/views/authentication/signup.client.view.html'
		}).
		state('signin', {
			url: '/signin',
			templateUrl: 'modules/users/views/authentication/signin.client.view.html'
		}).
		state('forgot', {
			url: '/password/forgot',
			templateUrl: 'modules/users/views/password/forgot-password.client.view.html'
		}).
		state('reset-invalid', {
			url: '/password/reset/invalid',
			templateUrl: 'modules/users/views/password/reset-password-invalid.client.view.html'
		}).
		state('reset-success', {
			url: '/password/reset/success',
			templateUrl: 'modules/users/views/password/reset-password-success.client.view.html'
		}).
		state('main', {
			url: '/main',
			templateUrl: 'modules/core/views/mainView.html'
		}).
		state('reset', {
			url: '/password/reset/:token',
			templateUrl: 'modules/users/views/password/reset-password.client.view.html'
		});
	}
]);
'use strict';

angular.module('users').controller('AuthenticationController', ['$scope', '$http', '$location', 'Authentication',
	function($scope, $http, $location, Authentication) {
		$scope.authentication = Authentication;

		// If user is signed in then redirect back home
		if ($scope.authentication.user) $location.path('/');

		$scope.signup = function() {
			$http.post('/auth/signup', $scope.credentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;

				// And redirect to the index page
				$location.path('/');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};

		$scope.signin = function() {
			$http.post('/auth/signin', $scope.credentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;

				// And redirect to the index page
				$location.path('/');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);
'use strict';

angular.module('users').controller('PasswordController', ['$scope', '$stateParams', '$http', '$location', 'Authentication',
	function($scope, $stateParams, $http, $location, Authentication) {
		$scope.authentication = Authentication;

		//If user is signed in then redirect back home
		if ($scope.authentication.user) $location.path('/');

		// Submit forgotten password account id
		$scope.askForPasswordReset = function() {
			$scope.success = $scope.error = null;

			$http.post('/auth/forgot', $scope.credentials).success(function(response) {
				// Show user success message and clear form
				$scope.credentials = null;
				$scope.success = response.message;

			}).error(function(response) {
				// Show user error message and clear form
				$scope.credentials = null;
				$scope.error = response.message;
			});
		};

		// Change user password
		$scope.resetUserPassword = function() {
			$scope.success = $scope.error = null;

			$http.post('/auth/reset/' + $stateParams.token, $scope.passwordDetails).success(function(response) {
				// If successful show success message and clear form
				$scope.passwordDetails = null;

				// Attach user profile
				Authentication.user = response;

				// And redirect to the index page
				$location.path('/password/reset/success');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);
'use strict';

angular.module('users').controller('SettingsController', ['$scope', '$http', '$location', 'Users', 'Authentication',
	function($scope, $http, $location, Users, Authentication) {
		$scope.user = Authentication.user;

		// If user is not signed in then redirect back home
		if (!$scope.user) $location.path('/');

		// Check if there are additional accounts 
		$scope.hasConnectedAdditionalSocialAccounts = function(provider) {
			for (var i in $scope.user.additionalProvidersData) {
				return true;
			}

			return false;
		};

		// Check if provider is already in use with current user
		$scope.isConnectedSocialAccount = function(provider) {
			return $scope.user.provider === provider || ($scope.user.additionalProvidersData && $scope.user.additionalProvidersData[provider]);
		};

		// Remove a user social account
		$scope.removeUserSocialAccount = function(provider) {
			$scope.success = $scope.error = null;

			$http.delete('/users/accounts', {
				params: {
					provider: provider
				}
			}).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.user = Authentication.user = response;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};

		// Update a user profile
		$scope.updateUserProfile = function(isValid) {
			if (isValid) {
				$scope.success = $scope.error = null;
				var user = new Users($scope.user);

				user.$update(function(response) {
					$scope.success = true;
					Authentication.user = response;
				}, function(response) {
					$scope.error = response.data.message;
				});
			} else {
				$scope.submitted = true;
			}
		};

		// Change user password
		$scope.changeUserPassword = function() {
			$scope.success = $scope.error = null;

			$http.post('/users/password', $scope.passwordDetails).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.passwordDetails = null;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);
'use strict';

// Authentication service for user variables
angular.module('users').factory('Authentication', ['$window', function($window) {
	var auth = {
		user: $window.user
	};
	
	return auth;
}]);

'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', ['$resource',
	function($resource) {
		return $resource('users', {}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);