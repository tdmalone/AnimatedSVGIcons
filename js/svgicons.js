
// https://github.com/ChromatixAU/AnimatedSVGIcons/blob/master/js/svgicons.js

/**
 * svgicons.js v1.0.0
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2013, Codrops
 * http://www.codrops.com
 *
 * Chromatix modifications v1.0.3
 * Modified by Tim Malone to:
 * - remove mobile checks
 * - allow customised viewbox sizing
 * - remove the need for a separate icon name in the config
 * - add support for alternate collection of properties based on media matches
 * - add support for parsing SVGs inline rather than using another external request
 * Modifications Copyright 2016, Chromatix
 * http://www.chromatix.com.au
 *
 */
;( function( window ) {
	
	'use strict';

	/*** helper functions ***/

	// from https://github.com/desandro/classie/blob/master/classie.js
	function classReg( className ) {
		return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
	}

	function hasClass( el, c ) {
		return 'classList' in document.documentElement ? el.classList.contains( c ) : classReg( c ).test( el.className )
	}

	function extend( a, b ) {
		for( var key in b ) { 
			if( b.hasOwnProperty( key ) ) {
				a[key] = b[key];
			}
		}
		return a;
	}

	// http://snipplr.com/view.php?codeview&id=5259
	function isMouseLeaveOrEnter( e, handler ) { 
		if (e.type != 'mouseout' && e.type != 'mouseover') return false; 
		var reltg = e.relatedTarget ? e.relatedTarget : 
		e.type == 'mouseout' ? e.toElement : e.fromElement; 
		while (reltg && reltg != handler) reltg = reltg.parentNode; 
		return (reltg != handler); 
	}
	
	// CHROMATIX TM 07/06/2016
	// add support for alternate collection of properties based on media matches
	function getMediaMatchedProperties(a){
		for(i in a.animProperties.mediaMatch){
			if(a.animProperties.mediaMatch[i].condition && window.matchMedia(a.animProperties.mediaMatch[i].condition).matches){
				return a.animProperties.mediaMatch[i];
			}
		}
		return a.animProperties.mediaMatch[0]; // default to whatever is first if no match was found
	}

	/*** svgIcon ***/

	function svgIcon( el, config, options ) {
		this.el = el;
		this.options = extend( {}, this.options );
  		extend( this.options, options );
		this.svg = Snap( this.options.size.w, this.options.size.h );
		this.svg.attr( 'viewBox', '0 0 '+this.options.size.w+' '+this.options.size.h ); // CHROMATIX TM 15/07/2015 - allow this to be customised
		this.el.appendChild( this.svg.node );
		// state
		this.toggled = false;
		// click event
		this.clickevent = "click"; // CHROMATIX TM 03/08/2015 - respond to "clicks" only - we'll handle the touch triggering of this separately
		// icons configuration
		this.config = config; // CHROMATIX TM 09/07/2015 - use the config directly to avoid needing a separate icon name
		// reverse?
		if( hasClass( this.el, 'si-icon-reverse' ) ) {
			this.reverse = true;
		}
		if( !this.config ) return;
		var self = this;
		
		// load/parse callback
		var callback = function (fragment) {
			var g = fragment.select( 'g' );
			self.svg.append( g );
			self.options.onLoad();
			self._initEvents();
			if( self.reverse ) {
				self.toggle();
			}
		};
		
		// load external svg
		// http://snapsvg.io/docs/#Snap.load
		if(this.config.url){
			Snap.load( this.config.url, callback );
			return;
		}
		
		// CHROMATIX TM 07/06/2016
		// add support for parsing SVGs inline rather than using another external request
		// http://snapsvg.io/docs/#Snap.parse
		if(this.config.svg){
			var fragment = Snap.parse(this.config.svg);
			callback(fragment);
			return;
		}
		
	}

	svgIcon.prototype.options = {
		speed : 200,
		easing : mina.linear,
		evtoggle : 'click', // click || mouseover
		size : { w : 64, h : 64 },
		onLoad : function() { return false; },
		onToggle : function() { return false; }
	};

	svgIcon.prototype._initEvents = function() {
		var self = this, toggleFn =  function( ev ) {
				if( ( ( ev.type.toLowerCase() === 'mouseover' || ev.type.toLowerCase() === 'mouseout' ) && isMouseLeaveOrEnter( ev, this ) ) || ev.type.toLowerCase() === self.clickevent ) {
					self.toggle(true);
					self.options.onToggle();	
				}
			};

		if( this.options.evtoggle === 'mouseover' ) {
			this.el.addEventListener( 'mouseover', toggleFn );
			this.el.addEventListener( 'mouseout', toggleFn );
		}
		else {
			this.el.addEventListener( this.clickevent, toggleFn );
		}
	};

	svgIcon.prototype.toggle = function( motion ) {
		if( !this.config.animation ) return;
		var self = this;
		for( var i = 0, len = this.config.animation.length; i < len; ++i ) {
			var a = this.config.animation[ i ],
				el = this.svg.select( a.el ),
				animProp = a.animProperties.mediaMatch ? getMediaMatchedProperties(a) : a.animProperties,
				animProp = this.toggled ? animProp.from : animProp.to,
				val = animProp.val, 
				timeout = motion && animProp.delayFactor ? animProp.delayFactor : 0;
			
			if( animProp.before ) {
				el.attr( JSON.parse( animProp.before ) );
			}

			if( motion ) {
				setTimeout(function( el, val, animProp ) { 
					return function() { el.animate( JSON.parse( val ), self.options.speed, self.options.easing, function() {
						if( animProp.after ) {
							this.attr( JSON.parse( animProp.after ) );
						}
						if( animProp.animAfter ) {
							this.animate( JSON.parse( animProp.animAfter ), self.options.speed, self.options.easing );
						}
					} ); }; 
				}( el, val, animProp ), timeout * self.options.speed );
			}
			else {
				el.attr( JSON.parse( val ) );
			}
				
		}
		this.toggled = !this.toggled;
	};

	// add to global namespace
	window.svgIcon = svgIcon;

})( window );