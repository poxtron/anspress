/* https://github.com/ultimatedelman/autogrow */
;
(function($) {

    //pass in just the context as a $(obj) or a settings JS object
    $.fn.autogrow = function(opts) {
        var that = $(this).css({
            overflow: 'hidden',
            resize: 'none'
        }) //prevent scrollies
            ,
            selector = that.selector,
            defaults = {
                context: $(document) //what to wire events to
                ,
                animate: true //if you want the size change to animate
                ,
                speed: 50 //speed of animation
                ,
                fixMinHeight: true //if you don't want the box to shrink below its initial size
                ,
                cloneClass: 'autogrowclone' //helper CSS class for clone if you need to add special rules
                ,
                onInitialize: false //resizes the textareas when the plugin is initialized
            };
        opts = $.isPlainObject(opts) ? opts : {
            context: opts ? opts : $(document)
        };
        opts = $.extend({}, defaults, opts);
        that.each(function(i, elem) {
            var min, clone;
            elem = $(elem);
            //if the element is "invisible", we get an incorrect height value
            //to get correct value, clone and append to the body. 
            if (elem.is(':visible') || parseInt(elem.css('height'), 10) > 0) {
                min = parseInt(elem.css('height'), 10) || elem.innerHeight();
            } else {
                clone = elem.clone().addClass(opts.cloneClass).val(elem.val()).css({
                    position: 'absolute',
                    visibility: 'hidden',
                    display: 'block'
                });
                $('body').append(clone);
                min = clone.innerHeight();
                clone.remove();
            }
            if (opts.fixMinHeight) {
                elem.data('autogrow-start-height', min); //set min height                                
            }
            elem.css('height', min);
            if (opts.onInitialize && elem.length) {
                resize.call(elem[0]);
            }
        });
        opts.context.on('keyup paste', selector, resize);

        function resize(e) {
            var box = $(this),
                oldHeight = box.innerHeight(),
                newHeight = this.scrollHeight,
                minHeight = box.data('autogrow-start-height') || 0,
                clone;
            if (oldHeight < newHeight) { //user is typing
                this.scrollTop = 0; //try to reduce the top of the content hiding for a second
                opts.animate ? box.stop().animate({
                    height: newHeight
                }, opts.speed) : box.innerHeight(newHeight);
            } else if (!e || e.which == 8 || e.which == 46 || (e.ctrlKey && e.which == 88)) { //user is deleting, backspacing, or cutting
                if (oldHeight > minHeight) { //shrink!
                    //this cloning part is not particularly necessary. however, it helps with animation
                    //since the only way to cleanly calculate where to shrink the box to is to incrementally
                    //reduce the height of the box until the $.innerHeight() and the scrollHeight differ.
                    //doing this on an exact clone to figure out the height first and then applying it to the
                    //actual box makes it look cleaner to the user
                    clone = box.clone()
                    //add clone class for extra css rules
                    .addClass(opts.cloneClass)
                    //make "invisible", remove height restriction potentially imposed by existing CSS
                    .css({
                        position: 'absolute',
                        zIndex: -10,
                        height: ''
                    })
                    //populate with content for consistent measuring
                    .val(box.val());
                    box.after(clone); //append as close to the box as possible for best CSS matching for clone
                    do { //reduce height until they don't match
                        newHeight = clone[0].scrollHeight - 1;
                        clone.innerHeight(newHeight);
                    } while (newHeight === clone[0].scrollHeight);
                    newHeight++; //adding one back eliminates a wiggle on deletion 
                    clone.remove();
                    box.focus(); // Fix issue with Chrome losing focus from the textarea.
                    //if user selects all and deletes or holds down delete til beginning
                    //user could get here and shrink whole box
                    newHeight < minHeight && (newHeight = minHeight);
                    oldHeight > newHeight && opts.animate ? box.stop().animate({
                        height: newHeight
                    }, opts.speed) : box.innerHeight(newHeight);
                } else { //just set to the minHeight
                    box.innerHeight(minHeight);
                }
            }
        }
        return that;
    }
})(jQuery);

jQuery(document).ready(function() {
    jQuery(document).click(function(e) {
        var target = e.target;
        if (!jQuery(target).is('.ap-dropdown-toggle') && !jQuery(target).parent().is('.open')) {
            jQuery('.ap-dropdown').removeClass('open');
        }
    });

    // Dropdown toggle
    jQuery('body').delegate('.ap-dropdown-toggle', 'click', function(e){
        e.preventDefault();
        jQuery('.ap-dropdown').removeClass('open');
        jQuery(this).closest('.ap-dropdown').addClass('open');
    });

    jQuery('.ap-tip').tooltipster({
        contentAsHTML: true,
        animation: 'fade',
        theme: 'tooltipster-default ap-tip-style',
        interactive: true,
        functionBefore: function(origin, continueTooltip) {
            var pos = ap_default(origin.data('tipposition'), 'top');
            var theme = ap_default(origin.data('tipclass'), 'top');
            jQuery(this).tooltipster('option', 'position', pos);
            jQuery(this).tooltipster('option', 'theme', 'tooltipster-default ap-tip-style ' + theme);
            continueTooltip();
        }
    });
    jQuery('#ap-conversation-scroll').scrollTop(0);

    jQuery('textarea.autogrow, textarea#post_content').autogrow({
        onInitialize: true
    });

    jQuery('.ap-categories-list li .ap-icon-arrow-down').click(function(e) {
        e.preventDefault();
        jQuery(this).parent().next().slideToggle(200);
    });
    if ((jQuery('#ask_question_form #post_content, #answer_form #post_content').length > 0) && typeof jQuery.jStorage !== 'undefined') {
        jQuery('#post_content').on('blur', function() {
            jQuery.jStorage.set('post_content', jQuery(this).val());
        });
        jQuery('#post_title').on('blur', function() {
            jQuery.jStorage.set('post_title', jQuery(this).val());
        });
        jQuery('select#category').on('blur', function() {
            jQuery.jStorage.set('category', jQuery(this).val());
        });
        jQuery('.anspress').delegate('[data-action="ap-add-tag"]', 'click touchstart', function() {
            jQuery.jStorage.set('tags', jQuery('[data-role="ap-tagsinput"]').tagsinput('items'));
        });
        if (typeof jQuery.jStorage.get('post_content') !== 'undefined') jQuery('#post_content').val(jQuery.jStorage.get('post_content'));
        if (typeof jQuery.jStorage.get('post_title') !== 'undefined') jQuery('#post_title').val(jQuery.jStorage.get('post_title'));
        if (typeof jQuery.jStorage.get('category') !== 'undefined') jQuery('select#category option[value="' + jQuery.jStorage.get('category') + '"]').prop('selected', true);
        if (typeof jQuery.jStorage.get('tags') !== 'undefined' && jQuery.jStorage.get('tags')) {
            jQuery.each(jQuery.jStorage.get('tags'), function(k, v) {
                jQuery('[data-role="ap-tagsinput"]').tagsinput('add', v);
            });
        }
    }
    jQuery('.ap-radio-btn').click(function() {
        jQuery(this).toggleClass('active');
    });
    jQuery('.bootstrap-tagsinput > input').keyup(function(event) {
        jQuery(this).css(width, 'auto');
    });


    jQuery('.ap-dynamic-avatar').initial({fontSize:15, fontWeight:600});
    jQuery( document ).ajaxComplete(function( event, data, settings ) {
        jQuery('.ap-dynamic-avatar').initial({fontSize:15, fontWeight:600});
    });


    jQuery('#answers .answer').waypoint(function(direction, pos) {
        jQuery('#answers .answer').removeClass('active');
        var total = parseInt(jQuery('[data-view="ap_answer_nav_total"]').text());
        var index = parseInt(jQuery(this.element).data('index'));
        var nav = jQuery('.ap-answers-nav');

        if((index == 1 && direction == 'up') || (index == total) )
            nav.hide();
        else
            nav.show();

        jQuery('[data-view="ap_answer_nav_cur"]').text(index);
        jQuery(this.element).addClass('active');
    }, {
        offset: '100'
    });

    jQuery('[data-acton="ap_answer_prev"]').click(function(e) {
        e.preventDefault();
        var cur = parseInt(jQuery('[data-view="ap_answer_nav_cur"]').text()) - 1;
        jQuery('html, body').animate({
            scrollTop: (jQuery('#answers .answer:nth-child('+cur+')').offset().top) - 100
        }, 500);
    });

    jQuery('[data-acton="ap_answer_next"]').click(function(e) {
        e.preventDefault();
        var cur = parseInt( jQuery('[data-view="ap_answer_nav_cur"]').text()) + 1;
        jQuery('html, body').animate({
            scrollTop: (jQuery('#answers .answer:nth-child('+cur+')').offset().top) - 99
        }, 500);
    });

    jQuery('body').delegate('#ap-question-tab a', 'click', function(e) {
        e.preventDefault();
        var load = AnsPress.site.showLoading(this);
        var link = jQuery(this).attr('href');
        var anc = this;
        jQuery('#anspress').load(link + ' #anspress', function(){jQuery(load).hide()});
    });

    jQuery('body').delegate('.ap-notify-item', 'click', function(e) {
        e.preventDefault();
        jQuery(this).hide();
    });
});

function ap_chk_activity_scroll(e) {
    if ((jQuery('#ap-conversation-scroll .ap-no-more-message').length == 0)) {
        var elem = jQuery(e.currentTarget);
        if (elem[0].scrollHeight - elem.scrollTop() == elem.outerHeight()) {
            APjs.site.loadMoreConversations(elem);
        }
    }
}