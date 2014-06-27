/*
 * Fuel UX Tree
 * https://github.com/ExactTarget/fuelux
 *
 * Copyright (c) 2014 ExactTarget
 * Licensed under the MIT license.
 */

// -- BEGIN UMD WRAPPER PREFACE --

// For more information on UMD visit: 
// https://github.com/umdjs/umd/blob/master/jqueryPlugin.js

(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// if AMD loader is available, register as an anonymous module.
		define(['jquery'], factory);
	} else {
		// OR use browser globals if AMD is not present
		factory(jQuery);
	}
}(function ($) {
	// -- END UMD WRAPPER PREFACE --
		
	// -- BEGIN MODULE CODE HERE --

	var old = $.fn.tree;

	// TREE CONSTRUCTOR AND PROTOTYPE

	var Tree = function (element, options) {
		this.$element = $(element);
		this.options = $.extend({}, $.fn.tree.defaults, options);

		this.$element.on('click.fu.tree', '.tree-item', $.proxy( function(ev) { this.selectItem(ev.currentTarget); } ,this));
		this.$element.on('click.fu.tree', '.tree-branch-name', $.proxy( function(ev) { this.openFolder(ev.currentTarget); }, this));

		if( this.options.folderSelect ){
			this.$element.off('click.fu.tree', '.tree-branch-name');
			this.$element.on('click.fu.tree', '.icon-caret', $.proxy( function(ev) { this.openFolder($(ev.currentTarget).parent()); }, this));
			this.$element.on('click.fu.tree', '.tree-branch-name', $.proxy( function(ev) { this.selectFolder($(ev.currentTarget).parent()); }, this));
		}

		this.render();
	};

	Tree.prototype = {
		constructor: Tree,

		render: function () {
			this.populate(this.$element);
		},

		populate: function ($el) {
			var self = this;
			var $parent = $el.parent();
			var loader = $parent.find('.tree-loader:eq(0)');

			loader.removeClass('hide');
			this.options.dataSource($el.data(), function (items) {
				loader.addClass('hide');

				$.each( items.data, function(index, value) {
					var $entity;

					if(value.type === "folder") {
						$entity = self.$element.find('.tree-branch:eq(0)').clone().removeClass('hide');
						$entity.find('.tree-branch-name label').html(value.name).attr('for', value.dataAttributes.id);
						$entity.find('.tree-branch-header').data(value);
					} else if (value.type === "item") {
						$entity = self.$element.find('.tree-item:eq(0)').clone().removeClass('hide');
						$entity.find('.tree-item-name label').html(value.name);
						$entity.data(value);
					}

					// Decorate $entity with data making the element
					// easily accessable with libraries like jQuery.
					//
					// Values are contained within the object returned
					// for folders and items as dataAttributes:
					//
					// {
					//     name: "An Item",
					//     type: 'item',
					//     dataAttributes = {
					//         'classes': 'required-item red-text',
					//         'data-parent': parentId,
					//         'guid': guid
					//     }
					// };

					// add attributes to tree-branch or tree-item
					var dataAttributes = value.dataAttributes || [];
					$.each(dataAttributes, function(key, value) {
						switch (key) {
						case 'class':
						case 'classes':
						case 'className':
							$entity.addClass(value);
							break;
						
						// allow custom icons
						case 'data-icon':
							$entity.find('.icon-item').removeClass().addClass('icon-item ' + value);
							$entity.attr(key, value);
							break;
												// allow custom icons
						case 'id':
							$entity.find('.tree-item-name label').attr('for', value);
							$entity.attr(key, value);
							break;

						// id, style, data-*
						default:
							$entity.attr(key, value);
							break;
						}
					});

					// add child nodes
					if($el.hasClass('tree-branch-header')) {
						$parent.find('.tree-branch-children:eq(0)').append($entity);
					} else {
						$el.append($entity);
					}
				});

				// return newly populated folder
				self.$element.trigger('loaded.fu.tree', $parent);
			});
		},

		selectItem: function (el) {
			var $el = $(el);
			var $all = this.$element.find('.tree-selected');
			var data = [];
			var $icon = $el.find('.icon-item');

			if (this.options.multiSelect) {
				$.each($all, function(index, value) {
					var $val = $(value);
					if($val[0] !== $el[0]) {
						data.push( $(value).data() );
					}
				});
			} else if ($all[0] !== $el[0]) {
				$all.removeClass('tree-selected')
					.find('.glyphicon').removeClass('glyphicon-ok').addClass('tree-dot');
				data.push($el.data());
			}

			var eventType = 'selected';
			if($el.hasClass('tree-selected')) {
				eventType = 'unselected';
				$el.removeClass('tree-selected');
				if($icon.hasClass('glyphicon-ok') || $icon.hasClass('fueluxicon-bullet') ) {
					$icon.removeClass('glyphicon-ok').addClass('fueluxicon-bullet');
				}
			} else {
				$el.addClass ('tree-selected');
				// add tree dot back in
				if($icon.hasClass('glyphicon-ok') || $icon.hasClass('fueluxicon-bullet') ) {
					$icon.removeClass('fueluxicon-bullet').addClass('glyphicon-ok');
				}
				if (this.options.multiSelect) {
					data.push( $el.data() );
				}
			}

			if(data.length) {
				this.$element.trigger('selected', {info: data});
			}

			// Return new list of selected items, the item
			// clicked, and the type of event:
			$el.trigger('updated.fu.tree', {
				info: data,
				item: $el,
				eventType: eventType
			});
		},

		openFolder: function (el) {
			var $el = $(el); // tree-branch-name
			var $parent;
			var $treeFolderContent;
			var $treeFolderContentFirstChild;

			// if item select only
			if (!this.options.folderSelect) {
				$el = $(el).parent(); // tree-branch, if tree-branch-name clicked
			}

			$parent = $el.parent(); // tree branch
			$treeFolderContent = $parent.find('.tree-branch-children');
			$treeFolderContentFirstChild = $treeFolderContent.eq(0);

			// manipulate branch/folder
			var eventType, classToTarget, classToAdd;
			if ($el.find('.glyphicon-folder-close').length) {
				eventType = 'opened';
				classToTarget = '.glyphicon-folder-close';
				classToAdd = 'glyphicon-folder-open';

				$parent.addClass('tree-open');
				$parent.attr('aria-expanded', 'true');

				$treeFolderContentFirstChild.removeClass('hide');
				if (!$treeFolderContent.children().length) {
					this.populate($treeFolderContent);
				}

			} else if($el.find('.glyphicon-folder-open')) {
				eventType = 'closed';
				classToTarget = '.glyphicon-folder-open';
				classToAdd = 'glyphicon-folder-close';

				$parent.removeClass('tree-open');
				$parent.attr('aria-expanded', 'false');
				$treeFolderContentFirstChild.addClass('hide');

				// remove if no cache
				if (!this.options.cacheItems) {
					$treeFolderContentFirstChild.empty();
				}

			}

			$parent.find('.icon-folder').eq(0)
				.removeClass('glyphicon-folder-close glyphicon-folder-open')
				.addClass(classToAdd);

			this.$element.trigger(eventType, $el.data());
		},

		selectFolder: function (el) {
			var $el = $(el);
			var $branchName = $(el).find('.tree-branch-name');
			// currently selected
			var $all = this.$element.find('.tree-branch-name.tree-selected');
			var data = [];
			var eventType = 'selected';

			if (this.options.multiSelect) {
				$.each($all, function(index, value) {
					var $val = $(value);
					if($val[0] !== $el[0]) {
						data.push( $(value).parent().find('.tree-branch-header').data() );
					}
				});
			} else if ($all[0] !== $el[0]) {
				$all.removeClass('tree-selected');
				data.push($el.parent().find('.tree-branch-header').data());
			}

			if($branchName.hasClass('tree-selected')) {
				eventType = 'unselected';
				$branchName.removeClass('tree-selected');
			} else {
				$branchName.addClass('tree-selected');
			}

			if(data.length) {
				this.$element.trigger('selected.fu.tree', {info: data});
			}

			// Return new list of selected items, the item
			// clicked, and the type of event:
			$el.trigger('updated.fu.tree', {
				info: data,
				item: $el,
				eventType: eventType
			});
		},

		selectedItems: function () {
			var $sel = this.$element.find('.tree-selected');
			var data = [];

			$.each($sel, function (index, value) {
				data.push($(value).data());
			});
			return data;
		},

		// collapses open folders
		collapse: function () {
			var cacheItems = this.options.cacheItems;

			// find open folders
			this.$element.find('.icon-folder-open').each(function () {
				// update icon class
				var $this = $(this)
					.removeClass('icon-folder-close icon-folder-open')
					.addClass('icon-folder-close');

				// "close" or empty folder contents
				var $parent = $this.parent().parent();
				var $folder = $parent.children('.tree-branch-children');

				$folder.addClass('hide');
				if (!cacheItems) {
					$folder.empty();
				}
			});
		}
	};


	// TREE PLUGIN DEFINITION

	$.fn.tree = function (option) {
		var args = Array.prototype.slice.call( arguments, 1 );
		var methodReturn;

		var $set = this.each(function () {
			var $this   = $( this );
			var data    = $this.data( 'tree' );
			var options = typeof option === 'object' && option;

			if( !data ) $this.data('tree', (data = new Tree( this, options ) ) );
			if( typeof option === 'string' ) methodReturn = data[ option ].apply( data, args );
		});

		return ( methodReturn === undefined ) ? $set : methodReturn;
	};

	$.fn.tree.defaults = {
		dataSource: function(options, callback){},
		multiSelect: false,
		cacheItems: true,
		folderSelect: false
	};

	$.fn.tree.Constructor = Tree;

	$.fn.tree.noConflict = function () {
		$.fn.tree = old;
		return this;
	};


	// NO DATA-API DUE TO NEED OF DATA-SOURCE

// -- BEGIN UMD WRAPPER AFTERWORD --
}));
	// -- END UMD WRAPPER AFTERWORD --
