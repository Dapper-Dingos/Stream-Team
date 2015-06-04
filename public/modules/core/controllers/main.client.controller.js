'use strict';

angular.module('core').controller('mainController', ['$scope', 'Menus',
	function($scope, Menus) {
		$scope.isCollapsed = false;
		$scope.menu = Menus.getMenu('topbar');

		$scope.toggleCollapsibleMenu = function() {
			$scope.isCollapsed = !$scope.isCollapsed;
		};

		// Collapsing the menu after navigation
		$scope.$on('$stateChangeSuccess', function() {
			$scope.isCollapsed = false;
		});
	}
])

.directive('youtube', 
	function($window) {
	  return {
	    restrict: "E",


	    scope: {
      		height:   "@",
      		width:    "@",
      		videoId:  "@"  
    	},

	    template: '<div></div>',

	    link: function(scope, element, attrs) {
	      var tag = document.createElement('script');
	      tag.src = "https://www.youtube.com/iframe_api";
	      var firstScriptTag = document.getElementsByTagName('script')[0];
	      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

	      var player;
	      //var searchVideos;

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
         	  },
          	  height: scope.height,
              width: scope.width,
              videoId: 'AXwGVXD7qEQ', //set to searchVideos
              events: {
              	'onReady': onPlayerReady,
              	'onStateChange': onPlayerStateChange
              }
       		});
	      };
	    },  
	  }
	});

	    function onPlayerStateChange(event){

	// If player is Playing
			if (event.data === 1) {
				console.log('playing')
				}
			
	//If Player is paused
			if (event.data === 2) {
				console.log('paused')
				}
			}
	//

		   function onPlayerReady(event){
		   	console.log('player ready')
		};