/*! Shoestring - v0.1.2 - 2014-07-17
* http://github.com/filamentgroup/shoestring/
* Copyright (c) 2014 Scott Jehl, Filament Group, Inc; Licensed MIT & GPLv2 */ 
(function( w, undefined ){	
	var doc = w.document,
		shoestring = function( prim, sec ){

			var pType = typeof( prim ),
				ret = [];

			if( prim ){
				// if string starting with <, make html
				if( pType === "string" && prim.indexOf( "<" ) === 0 ){
					var dfrag = document.createElement( "div" );
					dfrag.innerHTML = prim;
					return shoestring( dfrag ).children().each(function(){
						dfrag.removeChild( this );
					});
				}
				else if( pType === "function" ){
					return shoestring.ready( prim );
				}
				// if string, it's a selector, use qsa
				else if( pType === "string" ){
					if( sec ){
						return shoestring( sec ).find( prim );
					}
					for( var i = 0, sel = doc.querySelectorAll( prim ), il = sel.length; i < il; i++ ){
						ret[ i ] = sel[ i ];
					}
				}
				else if( pType === "object" && prim instanceof w.NodeList ){
					for( var i2 = 0, il2 = prim.length; i2 < il2; i2++ ){
						ret[ i2 ] = prim[ i2 ];
					}
				}
				// object? passthrough
				else {
					ret = ret.concat( prim );
				}
			}
			// if no prim, return a wrapped doc
			else{
				ret.push( doc );
			}

			ret = shoestring.extend( ret, shoestring.fn );

			// add selector prop
			ret.selector = prim;

			return ret;
		};

	// For adding element set methods
	shoestring.fn = {};

	// Public each method
	// For iteration on sets
	shoestring.fn.each = function( fn ){
		for( var i = 0, il = this.length; i < il; i++ ){
			fn.call( this[ i ], i );
		}
		return this;
	};

	// For contextual lookups
	shoestring.fn.find = function( sel ){
		var ret = [],
			finds;
		this.each(function(){
			finds = this.querySelectorAll( sel );
			for( var i = 0, il = finds.length; i < il; i++ ){
				ret = ret.concat( finds[i] );
			}
		});
		return shoestring( ret );
	};

	// Children - get element child nodes.
	// This is needed for HTML string creation
	shoestring.fn.children = function(){
		var ret = [],
			childs,
			j;
		this.each(function(){
			childs = this.children;
			j = -1;

			while( j++ < childs.length-1 ){
				if( shoestring.inArray(  childs[ j ], ret ) === -1 ){
					ret.push( childs[ j ] );
				}
			}
		});
		return shoestring(ret);
	};

	// Public non-dom utilities

	// browser support qualifier - shoestring any usage of shoestring in a qualify callback
	shoestring.qualified = "querySelectorAll" in doc;

	shoestring.qualify = function( callback ){
		if( callback && shoestring.qualified ){
			return callback();
		}
		// return support bool if there's no callback
		else if( !callback ){
			return shoestring.qualified;
		}
	};

	// For extending objects
	shoestring.extend = function( first, second ){
		for( var i in second ){
			if( second.hasOwnProperty( i ) ){
				first[ i ] = second[ i ];
			}
		}
		return first;
	};

	// check if an item exists in an array
	shoestring.inArray = function( needle, haystack ){
		var isin = -1;
		for( var i = 0, il = haystack.length; i < il; i++ ){
			if( haystack.hasOwnProperty( i ) && haystack[ i ] === needle ){
				isin = i;
			}
		}
		return isin;
	};

	// For DOM ready execution
	shoestring.ready = function( fn ){
		if( ready && fn && shoestring.qualified ){
			fn.call( document );
		}
		else if( fn && shoestring.qualified ){
			readyQueue.push( fn );
		}
		else {
			runReady();
		}

		return [doc];
	};

	// non-shortcut ready
	shoestring.fn.ready = function( fn ){
		shoestring.ready( fn );
		return this;
	};

	// Empty and exec the ready queue
	var ready = false,
		readyQueue = [],
		runReady = function(){
			if( !ready ){
				while( readyQueue.length ){
					readyQueue.shift().call( document );
				}
				ready = true;
			}
		};

	// Quick IE8 shiv
	if( !w.addEventListener ){
		w.addEventListener = function( evt, cb ){
			return w.attachEvent( "on" + evt, cb );
		};
	}

	// DOM ready
	// If DOM is already ready at exec time
	if( doc.readyState === "complete" || doc.readyState === "interactive" ){
		runReady();
	}
	else {
		if( !w.document.addEventListener ){
			w.document.attachEvent( "DOMContentLoaded", runReady );
			w.document.attachEvent( "onreadystatechange", runReady );
		} else {
			w.document.addEventListener( "DOMContentLoaded", runReady, false );
			w.document.addEventListener( "readystatechange", runReady, false );
		}
		w.addEventListener( "load", runReady, false );
	}

	// expose
	w.shoestring = shoestring;



	shoestring.enUS = {
		errors: {
			prefix: "Shoestring does not support",
			'click': "the click method. Try using trigger( 'click' ) instead",
			'has-class' : " the hasClass method. Try using .is( '.klassname' ) instead.",
			'live-delegate' : "the .live or .delegate methods. Use .bind or .on instead.",
			'next-selector' : "passing selectors into .next, try .next().filter( selector )",
			'on-delegate' : " the .on method with three or more arguments. Using .on( eventName, callback ) instead.",
			'prev-selector' : "passing selectors into .prev, try .prev().filter( selector )",
			'text-setter': "setting text via the .text method.",
			'event-namespaces': "event namespacing, especially on .unbind( '.myNamespace' ). An event namespace is treated as part of the event name."
		}
	};

	shoestring.error = function( id ) {
		var errors = shoestring.enUS.errors;
		throw new Error( errors.prefix + " " + errors[id] );
	};



	var xmlHttp = function() {
		try {
			return new XMLHttpRequest();
		}
		catch( e ){
			return new ActiveXObject( "Microsoft.XMLHTTP" );
		}
	};

	shoestring.ajax = function( url, options ) {
		var req = xmlHttp(),
			settings = shoestring.extend( {}, shoestring.ajax.settings );

		if( options ){
			shoestring.extend( settings, options );
		}
		if( !url ){
			url = settings.url;
		}

		if( !req || !url ){
			return;
		}

		req.open( settings.method, url, settings.async );

		if( req.setRequestHeader ){
			req.setRequestHeader( "X-Requested-With", "XMLHttpRequest" );
		}

		req.onreadystatechange = function () {
			if( req.readyState === 4 ){
				// Trim the whitespace so shoestring('<div>') works
				var res = (req.responseText || '').replace(/^\s+|\s+$/g, '');
				if( req.status.toString().indexOf( "0" ) === 0 ){
					return settings.cancel( res, req.status, req );
				}
				else if ( req.status.toString().match( /^(4|5)/ ) && RegExp.$1 ){
					return settings.error( res, req.status, req );
				}
				else {
					return settings.success( res, req.status, req );
				}
			}
		};

		if( req.readyState === 4 ){
			return req;
		}

		req.send( null );
		return req;
	};

	shoestring.ajax.settings = {
		success: function(){},
		error: function(){},
		cancel: function(){},
		method: "GET",
		async: true,
		data: null
	};



	shoestring.get = function( url, callback ){
		return shoestring.ajax( url, { success: callback } );
	};



	shoestring.fn.load = function( url, callback ){
		var self = this,
			args = arguments,
			intCB = function( data ){
				self.each(function(){
					shoestring( this ).html( data );
				});
				if( callback ){
					callback.apply( self, args );
				}
		};
		shoestring.ajax( url, { success: intCB } );
		return this;
	};



	shoestring.post = function( url, data, callback ){
		return shoestring.ajax( url, { data: data, method: "POST", success: callback } );
	};


// Extensions

// keep this wrapper around the ones you use!
	shoestring.fn.data = function( name, val ){
		if( name !== undefined ){
			if( val !== undefined ){
				return this.each(function(){
					if( !this.shoestringData ){
						this.shoestringData = {};
					}
					this.shoestringData[ name ] = val;
				});
			}
			else {
				return this.length && this[ 0 ].shoestringData ? this[ 0 ].shoestringData[ name ] : undefined;
			}
		}
		else {
			return this.length ? this[ 0 ].shoestringData || {} : undefined;
		}
	};
// Extensions

// keep this wrapper around the ones you use!
	shoestring.fn.removeData = function( name ){
		return this.each(function(){
			if( name !== undefined && this.shoestringData ){
				this.shoestringData[ name ] = undefined;
				delete this.shoestringData[ name ];
			}
			else {
				this[ 0 ].shoestringData = {};
			}
		});
	};

	window.$ = shoestring;



	shoestring.fn.addClass = function( cname ){
		var classes = cname.replace(/^\s+|\s+$/g, '').split( " " );
		return this.each(function(){
			for( var i = 0, il = classes.length; i < il; i++ ){
				if( this.className !== undefined && ( this.className === "" || !this.className.match( new RegExp( "(^|\\s)" + classes[ i ] + "($|\\s)" ) ) ) ){
					this.className += " " + classes[ i ];
				}
			}
		});
	};



	shoestring.fn.add = function( sel ){
		var ret = [];
		this.each(function(){
			ret.push( this );
		});

		shoestring( sel ).each(function(){
			ret.push( this );
		});

		return shoestring( ret );
	};



	shoestring.fn.after = function( frag ){
		if( typeof( frag ) === "string" || frag.nodeType !== undefined ){
			frag = shoestring( frag );
		}
		return this.each(function( i ){
			for( var j = 0, jl = frag.length; j < jl; j++ ){
				var insertEl = i > 0 ? frag[ j ].cloneNode( true ) : frag[ j ];
				this.parentNode.insertBefore( insertEl, this.nextSibling );
			}
		});
	};

	shoestring.fn.insertAfter = function( sel ){
		return this.each(function(){
			shoestring( sel ).after( this );
		});
	};



	shoestring.fn.append = function( frag ){
		if( typeof( frag ) === "string" || frag.nodeType !== undefined ){
			frag = shoestring( frag );
		}
		return this.each(function( i ){
			for( var j = 0, jl = frag.length; j < jl; j++ ){
				this.appendChild( i > 0 ? frag[ j ].cloneNode( true ) : frag[ j ] );
			}
		});
	};

	shoestring.fn.appendTo = function( sel ){
		return this.each(function(){
			shoestring( sel ).append( this );
		});
	};



	shoestring.fn.attr = function( name, val ){
		var nameStr = typeof( name ) === "string";
		if( val !== undefined || !nameStr ){
			return this.each(function(){
				if( nameStr ){
					this.setAttribute( name, val );
				}
				else {
					for( var i in name ){
						if( name.hasOwnProperty( i ) ){
							this.setAttribute( i, name[ i ] );
						}
					}
				}
			});
		}
		else {
			return this[ 0 ] ? this[ 0 ].getAttribute( name ) : undefined;
		}
	};



	shoestring.fn.before = function( frag ){
		if( typeof( frag ) === "string" || frag.nodeType !== undefined ){
			frag = shoestring( frag );
		}
		return this.each(function( i ){
			for( var j = 0, jl = frag.length; j < jl; j++ ){
				this.parentNode.insertBefore( i > 0 ? frag[ j ].cloneNode( true ) : frag[ j ], this );
			}
		});
	};

	shoestring.fn.insertBefore = function( sel ){
		return this.each(function(){
			shoestring( sel ).before( this );
		});
	};



	shoestring.fn.clone = function() {
		var ret = [];
		this.each(function() {
			ret.push( this.cloneNode( true ) );
		});
		return $( ret );
	};



	shoestring.fn.is = function( sel ){
		var ret = false;
		this.each(function(){
			if( shoestring.inArray( this, shoestring( sel ) )  > -1 ){
				ret = true;
			}
		});
		return ret;
	};



	shoestring.fn.closest = function( sel ){
		var ret = [];
		if( !sel ){
			return shoestring( ret );
		}

		this.each(function(){
			var element, $self = shoestring( element = this );

			if( $self.is(sel) ){
				ret.push( this );
				return;
			}

			while( element.parentElement ) {
				if( shoestring(element.parentElement).is(sel) ){
					ret.push( element.parentElement );
					break;
				}

				element = element.parentElement;
			}
		});

		return shoestring( ret );
	};



	// IE8 uses marginRight instead of margin-right
	function convertPropertyName( str ) {
		return str.replace( /\-([A-Za-z])/g, function ( match, character ) {
			return character.toUpperCase();
		});
	}

	function setStyle( element, property, value ) {
		element.style[ property ] = value;
		element.style[ convertPropertyName(property) ] = value;
	}

	function _getStyle( element, property ) {
		var view = document.defaultView,
				docElement = document.documentElement;

		// if the defaultView is available use that to calculate the style
		// otherwise use the property from the object itself
		if( view ){
			return view
				.getComputedStyle( element, null )
				.getPropertyValue( property );
		} else {
			return docElement.currentStyle[ property ] ? element.currentStyle[ property ] : undefined;
		}
	}

	function getStyle( element, property ) {
		var convert = convertPropertyName( property );

		// try both default to undefined
		return _getStyle( element, convert ) || _getStyle( element, property ) || undefined;
	}

	shoestring.fn.css = function( prop, value ){
		if( !this[0] ){
			return;
		}

		if( typeof prop === "object" ) {
			return this.each(function() {
				for( var key in prop ) {
					if( prop.hasOwnProperty( key ) ) {
						setStyle( this, key, prop[key] );
					}
				}
			});
		}	else {
			// assignment else retrieve first
			if( value !== undefined ){
				return this.each(function(){
					setStyle( this, prop, value );
				});
			}	else {
				return getStyle( this[0], prop );
			}
		}
	};



	shoestring.fn.eq = function( num ){
		if( this[ num ] ){
			return shoestring( this[ num ] );
		}
		return shoestring([]);
	};



	shoestring.fn.filter = function( sel ){
		var ret = [];

		this.each(function(){

			if( !this.parentNode ){
				var context = shoestring( document.createDocumentFragment() );
				context[ 0 ].appendChild( this );
				wsel = shoestring( sel, context );
			} else {
				wsel = shoestring( sel, this.parentNode );
			}

			if( shoestring.inArray( this, wsel ) > -1 ){
				ret.push( this );
			}
		});

		return shoestring( ret );
	};


  shoestring.fn.first = function(){
		return this.eq( 0 );
	};


	shoestring.fn.get = function( num ){
		return this[ num ];
	};



	shoestring.fn.height = function( num ){
		if( num === undefined ){
			return this[ 0 ].offsetHeight;
		} else {
			// support integer values as pixels
			num = typeof num === "string" ? num : num + "px";

			return this.each(function(){
				this.style.height = num;
			});
		}
	};



	shoestring.fn.html = function( html ){
		if( html ){
			return this.each(function(){
				this.innerHTML = html;
			});
		}
		else{
			var pile = "";
			this.each(function(){
				pile += this.innerHTML;
			});
			return pile;
		}
	};



	function _getIndex( set, test ) {
		var i, result, element;

		for( i = result = 0; i < set.length; i++ ) {
			element = set.item ? set.item(i) : set[i];

			if( test(element) ){
				return result;
			}

			// ignore text nodes, etc
			// NOTE may need to be more permissive
			if( element.nodeType === 1 ){
				result++;
			}
		}

		return -1;
	}

	shoestring.fn.index = function( selector ){
		var self, children;

		self = this;

		// no arg? check the children, otherwise check each element that matches
		if( selector === undefined ){
			children = (this[0].parentNode || document.documentElement).childNodes;

			// check if the element matches the first of the set
			return _getIndex(children, function( element ) {
				return self[0] === element;
			});
		} else {

			// check if the element matches the first selected node from the parent
			return _getIndex(self, function( element ) {
				return element === (shoestring( selector, element.parentNode )[ 0 ]);
			});
		}
	};



	shoestring.fn.last = function(){
		return this.eq( this.length - 1 );
	};



	shoestring.fn.next = function(){
				if( arguments.length > 0 ){
			shoestring.error( 'next-selector' );
		}
		
		var result = [];

		// TODO need to implement map
		this.each(function() {
			var children, item, found;

			// get the child nodes for this member of the set
			children = shoestring( this.parentNode )[0].childNodes;

			for( var i = 0; i < children.length; i++ ){
				item = children.item( i );

				// found the current item grab the next viable node
				// NOTE may need to be more permissive
				if( found && item.nodeType === 1 ){
					result.push( item );
					break;
				}

				// find the current item and mark it as found
				if( children.item( i ) === this ){
					found = true;
				}
			}
		});

		return shoestring( result );
	};



	shoestring.fn.not = function( sel ){
		var ret = [];

		this.each(function(){
			var found = shoestring( sel, this.parentNode );

			if( shoestring.inArray(this, found) === -1 ){
				ret.push( this );
			}
		});

		return shoestring( ret );
	};



	shoestring.fn.offset = function(){
		return {
			top: this[ 0 ].offsetTop,
			left: this[ 0 ].offsetLeft
		};
	};



	shoestring.fn.parent = function(){
		var ret = [],
			parent;

		this.each(function(){
			// no parent node, assume top level
			// TODO maybe this should be a more precise check for the document?
			parent = this.parentElement || document.documentElement;

			if( parent ){
				ret.push( parent );
			}
		});

		return shoestring(ret);
	};



	shoestring.fn.parents = function( sel ){
		var ret = [];

		this.each(function(){
			var curr = this,
				match;
			while( curr.parentElement && !match ){
				curr = curr.parentElement;
				if( sel ){
					if( curr === shoestring( sel )[0] ){
						match = true;
						if( shoestring.inArray( curr, ret ) === -1 ){
							ret.push( curr );
						}
					}
				} else {
					if( shoestring.inArray( curr, ret ) === -1 ){
						ret.push( curr );
					}
				}
			}
		});
		return shoestring(ret);
	};



	shoestring.fn.prepend = function( frag ){
		if( typeof( frag ) === "string" || frag.nodeType !== undefined ){
			frag = shoestring( frag );
		}
		return this.each(function( i ){

			for( var j = 0, jl = frag.length; j < jl; j++ ){
				var insertEl = i > 0 ? frag[ j ].cloneNode( true ) : frag[ j ];
				if ( this.firstChild ){
					this.insertBefore( insertEl, this.firstChild );
				}
				else {
					this.appendChild( insertEl );
				}
			}
		});
	};

	shoestring.fn.prependTo = function( sel ){
		return this.each(function(){
			shoestring( sel ).prepend( this );
		});
	};



	shoestring.fn.prevAll = function(){
		var ret = [];
		this.each(function(){
			var self = this;
			while( self.previousElementSibling ){
				ret = ret.concat( self.previousElementSibling );
				self = self.previousElementSibling;
			}
		});
		return shoestring(ret);
	};



	shoestring.fn.prev = function(){
		var ret = [], next;

				if( arguments.length > 0 ){
			shoestring.error( 'prev-selector' );
		}
		
		this.each(function(){
			next = this.previousElementSibling;
			if( next ){
				ret = ret.concat( next );
			}
		});

		return shoestring(ret);
	};



	shoestring.fn.prop = function( name, val ){
		name = shoestring.propFix[ name ] || name;
		if( val !== undefined ){
			return this.each(function(){
				this[ name ] = val;
			});
		}
		else {
			return this[ 0 ][ name ];
		}
	};

	// Property normalization, a subset taken from jQuery src
	shoestring.propFix = {
		"class": "className",
		contenteditable: "contentEditable",
		"for": "htmlFor",
		readonly: "readOnly",
		tabindex: "tabIndex"
	};



	shoestring.fn.removeAttr = function( attr ){
		return this.each(function(){
			this.removeAttribute( attr );
		});
	};



	shoestring.fn.removeClass = function( cname ){
		var classes = cname.replace(/^\s+|\s+$/g, '').split( " " );

		return this.each(function(){
			for( var i = 0, il = classes.length; i < il; i++ ){
				if( this.className !== undefined ){
					this.className = this.className.replace( new RegExp( "(^|\\s)" + classes[ i ] + "($|\\s)", "gmi" ), " " );
				}
			}
		});
	};



	shoestring.fn.remove = function(){
		return this.each(function(){
			this.parentNode.removeChild( this );
		});
	};



	shoestring.fn.removeProp = function( prop ){
		var name = shoestring.propFix && shoestring.propFix[ name ] || name;
		return this.each(function(){
			this[ prop ] = undefined;
			delete this[ prop ];
		});
	};



	shoestring.fn.replaceWith = function( frag ){
		if( typeof( frag ) === "string" ){
			frag = shoestring( frag );
		}
		var ret = [];
		this.each(function( i ){
			for( var j = 0, jl = frag.length; j < jl; j++ ){
				var insertEl = i > 0 ? frag[ j ].cloneNode( true ) : frag[ j ];
				this.parentNode.insertBefore( insertEl, this );
				insertEl.parentNode.removeChild( this );
				ret.push( insertEl );
			}
		});
		return shoestring( ret );
	};



	shoestring.fn.serialize = function(){
		var data = {};
		shoestring( "input, select", this ).each(function(){
			var type = this.type,
				name = this.name,
				value = this.value;

			if( /text|hidden|password|color|date|datetime|datetime\-local|email|month|number|range|search|tel|time|url|week/.test( type ) || ( type === "checkbox" || type === "radio" ) && this.checked ){
				data[ name ] = value;
			}
			else if( this.nodeName === "select" ){
				data[ name ] = this.options[ this.selectedIndex ].nodeValue;
			}
		});
		return data;
	};



	shoestring.fn.siblings = function(){
		if( !this.length ) {
			return shoestring( [] );
		}

		var sibs = [],
			el = this[ 0 ].parentNode.firstChild;

		do {
			if( el.nodeType === 1 && el !== this[ 0 ] ) {
				sibs.push( el );
			}

      el = el.nextSibling;
		} while( el );

		return shoestring( sibs );
	};



	var getText = function( elem ){
		var node,
			ret = "",
			i = 0,
			nodeType = elem.nodeType;

		if ( !nodeType ) {
			// If no nodeType, this is expected to be an array
			while ( (node = elem[i++]) ) {
				// Do not traverse comment nodes
				ret += getText( node );
			}
		} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
			// Use textContent for elements
			// innerText usage removed for consistency of new lines (jQuery #11153)
			if ( typeof elem.textContent === "string" ) {
				return elem.textContent;
			} else {
				// Traverse its children
				for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
					ret += getText( elem );
				}
			}
		} else if ( nodeType === 3 || nodeType === 4 ) {
			return elem.nodeValue;
		}
		// Do not include comment or processing instruction nodes

		return ret;
	};

	shoestring.fn.text = function() {
				if( arguments.length > 0 ){
			shoestring.error( 'text-setter' );
		}
		
		return getText( this );
	};




	shoestring.fn.val = function( val ){
		if( val !== undefined ){
			return this.each(function(){
				if( this.tagName === "SELECT" ){
					var optionSet, option,
						options = elem.options,
						values = [],
						i = options.length,
						newIndex;

					values[0] = val;
					while ( i-- ) {
						option = options[ i ];
						if ( (option.selected = shoestring.inArray( option.value, values ) >= 0) ) {
							optionSet = true;
							newIndex = i;
						}
					}
					// force browsers to behave consistently when non-matching value is set
					if ( !optionSet ) {
						elem.selectedIndex = -1;
					} else {
						elem.selectedIndex = i;
					}
				} else {
					this.value = val;
				}
			});
		}
		else {
			if( this.tagName === "SELECT" ){
				return this.options[ this[0].selectedIndex ].value;
			} else {
				return this[0].value;
			}
		}
	};



	shoestring.fn.width = function( num ){
		if( num === undefined ){
			return this[ 0 ].offsetWidth;
		}
		else {
			return this.each(function(){
				this.style.width = num;
			});
		}
	};



	shoestring.fn.wrapInner = function( html ){
		return this.each(function(){
			var inH = this.innerHTML;
			this.innerHTML = "";
			shoestring( this ).append( shoestring( html ).html( inH ) );
		});
	};



	shoestring.fn.bind = function( evt, callback ){

				if( arguments.length > 2 ){
			shoestring.error( 'on-delegate' );
		}
		
		var evts = evt.split( " " ),
			docEl = document.documentElement,
			bindingname = callback.toString(),
			boundEvents = function( el, evt, callback ) {
				if ( !el.shoestringData ) {
					el.shoestringData = {};
				}
				if ( !el.shoestringData.events ) {
					el.shoestringData.events = {};
				}
				if ( !el.shoestringData.events[ evt ] ) {
					el.shoestringData.events[ evt ] = [];
				}
				el.shoestringData.events[ evt ][ callback.name ] = callback.callfunc;
				// IE custom events
				el.shoestringData.events[ evt ][ '_' + callback.name ] = callback._callfunc;
			};

		function newCB( e ){
			return callback.apply( this, [ e ].concat( e._args ) );
		}
		function propChange( e, boundElement ) {
			var lastEvent = document.documentElement[ e.propertyName ],
				triggeredElement = lastEvent.el;

			if( triggeredElement !== undefined && shoestring( triggeredElement ).closest( boundElement ).length ) {
				newCB.call( triggeredElement, e );
			}
		}

		return this.each(function(){
			var callback, oEl = this;

			callback = function( e ) {
				propChange.call( this, e, oEl );
			};

			for( var i = 0, il = evts.length; i < il; i++ ){
				var evt = evts[ i ];

				if( "addEventListener" in this ){
					this.addEventListener( evt, newCB, false );
				} else if( this.attachEvent ){
					if( this[ "on" + evt ] !== undefined ) {
						this.attachEvent( "on" + evt, newCB );
					} else {
						// Custom event
						docEl.attachEvent( "onpropertychange", callback );
					}
				}
				boundEvents( this, evts[ i ], { "callfunc" : newCB, "name" : bindingname, "_callfunc": callback });
			}
		});
	};

	shoestring.fn.on = shoestring.fn.bind;

		shoestring.fn.live = function(){
		shoestring.error( 'live-delegate' );
	};
	shoestring.fn.delegate = function(){
		shoestring.error( 'live-delegate' );
	};
		


	shoestring.fn.unbind = function( evt, callback ){
		var evts = evt.split( " " ),
			docEl = document.documentElement;
		return this.each(function(){
			var ev;
			for( var i = 0, il = evts.length; i < il; i++ ){
								if( evts[ i ].indexOf( "." ) === 0 ) {
					shoestring.error( 'event-namespaces' );
				}
				
				var bound = this.shoestringData.events[ evt ],
					bindingname;
				if( "removeEventListener" in window ){
					if( callback !== undefined ) {
						bindingname = callback.toString();
						this.removeEventListener( evts[ i ], bound[ bindingname ], false );
					} else {
						for ( ev in bound ) {
							this.removeEventListener( evts[ i ], bound[ ev ], false );
						}
					}
				}
				else if( this.detachEvent ){
					if( callback !== undefined ) {
						bindingname = callback.toString();
						this.detachEvent( "on" + evts[ i ], bound[ bindingname ] );
						// custom event
						docEl.detachEvent( "onpropertychange", bound[ '_' + bindingname ] );
					} else {
						for ( ev in bound ) {
							// since the _ev and ev will both be keys here, we’ll detach both methods for each
							this.detachEvent( "on" + evts[ i ], bound[ ev ] );
							// custom event
							docEl.detachEvent( "onpropertychange", bound[ ev ] );
						}
					}
				}
			}
		});
	};



	shoestring.fn.one = function( evt, callback ){
		var evts = evt.split( " " );
		return this.each(function(){
			var cbs = {},
				$t = shoestring( this );

			for( var i = 0, il = evts.length; i < il; i++ ){
				var thisevt = evts[ i ];
				cbs[ thisevt ] = function( e ){
					var $t = shoestring( this );
					for( var j in cbs ) {
						$t.unbind( j, cbs[ j ] );
					}
					callback.apply( this, [ e ].concat( e._args ) );
				};
				$t.bind( thisevt, cbs[ thisevt ] );
			}
		});
	};



	shoestring.fn.triggerHandler = function( evt, args ){
		var e = evt.split( " " )[ 0 ],
			el = this[ 0 ],
			ret;

		// TODO needs IE8 support
		if( document.createEvent && el.shoestringData && el.shoestringData.events && el.shoestringData.events[ e ] ){
			var bindings = el.shoestringData.events[ e ];
			for (var i in bindings ){
				if( bindings.hasOwnProperty( i ) ){
					var event = document.createEvent( "Event" );
					event.initEvent( e, true, true );
					event._args = args;
					ret = bindings[ i ]( event );
				}
			}
		}

		return ret;
	};



	shoestring.fn.trigger = function( evt, args ){
		var evts = evt.split( " " );
		return this.each(function(){
			for( var i = 0, il = evts.length; i < il; i++ ){
				if( document.createEvent ){
					var event = document.createEvent( "Event" );
					event.initEvent( evts[ i ], true, true );
					event._args = args;
					this.dispatchEvent( event );
				} else if ( document.createEventObject ) {
					if( this[ 'on' + evts[ i ] ] !== undefined ) {
						this.fireEvent( 'on' + evts[ i ], document.createEventObject() );
					} else {
						document.documentElement[ evts[ i ] ] = {
							"el": this,
							_args: args
						};
					}
				}
			}
		});
	};



	shoestring.each = function( obj, callback, args ){
		var value,
			i = 0,
			length = obj.length,
			isArray = ( typeof obj === "array" );

		if ( args ) {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			}

		// A special, fast, case for the most common use of each
		} else {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			}
		}

		return shoestring( obj );
	};



	shoestring.merge = function( first, second ){
		var l = second.length,
			i = first.length,
			j = 0;

		if ( typeof l === "number" ) {
			for ( ; j < l; j++ ) {
				first[ i++ ] = second[ j ];
			}
		} else {
			while ( second[j] !== undefined ) {
				first[ i++ ] = second[ j++ ];
			}
		}

		first.length = i;

		return shoestring( first );
	};




			shoestring.fn.hasClass = function(){
		shoestring.error( 'has-class' );
	};
	


			shoestring.fn.click = function(){
		shoestring.error( 'click' );
	};
	


})( this );