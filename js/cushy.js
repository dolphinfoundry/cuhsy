/**
 * Created by Suman on 13/12/16.
 */

jQuery(function($) {
    var isLocal = false;
    var endpoint = (isLocal) ? 'dev.cushy.com' : 'cushy.com';
    var apiBaseUrl = 'https://' + endpoint;
    var $this = $(document);
    var pluginUrl = $this.find('input#pluginPath').val();
    var trackPage = 1;
    var loading  = false;
    var selectedItems = [];
    var isResized = false;

    $this.addClass('cushy-media-modal media-modal');
    $this.find('a#add-cushy-button').html('<img src="'+ pluginUrl +'/assets/cushy-logo.png" alt="add cushy" style="width:18px; margin-top: -4px;" />Add Cushy');

    $.fn.calculateAspectRatioFit = function(srcWidth, srcHeight, maxWidth, maxHeight) {
        var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        return { width: srcWidth*ratio, height: srcHeight*ratio };
    };

    $.fn.loadIframeContents = function() {
        if(typeof $.fn.iFrameResize != 'undefined') {
            iFrameResize({
                log:false,
                //maxHeight: 100,
                initCallback: function (iframe) {

                },
                //checkOrigin:true,
                //interval: 0,
                //enablePublicMethods     : true,                  // Enable methods within iframe hosted page
                //enableInPageLinks       : true,
                resizedCallback: function(messageData){
                    var $this = $("iframe#" + messageData.iframe.id);
                    var imgWidth = $this.contents().find('.cushy-img').eq(0).width();
                    var imgHeight = $this.contents().find('.cushy-img').eq(0).height();

                    $(window).resize(function () {
                        $this = $("iframe#" + messageData.iframe.id);
                        //var w = $this.contents().find('.cushy-img')[0].naturalWidth;

                        if (!$this.hasClass('is-resized')) {
                            imgWidth = $this.contents().find('.cushy-img').eq(0).width();
                            imgHeight = $this.contents().find('.cushy-img').eq(0).height();
                            setTimeout(function () {
                                $this.css({'width': imgWidth + 'px', 'height': imgHeight + 'px'}).addClass('is-resized');
                            }, 100);
                        }
                    });


                    if (!$this.hasClass('is-resized')) {
                        setTimeout(function () {
                            if (imgWidth > 0) {
                                $this.prev('.iframe-pre-loader').css({'background': 'none', 'z-index': -1});
                            }

                            $this.contents().find('.cushy-img').eq(0).css('visibility', 'visible');
                            $this.css({'width': imgWidth + 'px', 'height': imgHeight + 'px'}).addClass('is-resized');
                        }, 100);
                    }
                },
                messageCallback         : function(messageData){ // Callback fn when message is received
                    /* $('p#callback').html(
                     '<b>Frame I</b> '    + messageData.iframe.id +
                     ' <b>Message:</b> '    + messageData.message
                     ); */
                    //alert(messageData.message);
                },
                closedCallback         : function(id){ // Callback fn when iFrame is closed
                    /* $('p#callback').html(
                     '<b>IFrame (</b>'    + id +
                     '<b>) removed from page.</b>'
                     ); */
                }
            });
        }
    }

    $(window).resize(function () {
        $.fn.loadIframeContents();
    });

    // Initialize the iframe content
    $.fn.loadIframeContents();

    $this.on('click', '#test', function(){
        var username = $("#username").val();
        if(!(username)){
            alert("Please enter username");
            return false;
        }else{
            $.ajax({
                url: apiBaseUrl + '/sections/auth.php',
                data: {username:username},
                dataType: "jsonp",
                success:function(response){ console.info(response);
                    if(response.success !== undefined && response.success == 1){
                        $('#form').submit();
                        return true;
                    }else{
                        $("#username").focus();
                        $("#error").text("User name error");

                    }
                },
                error:function(){
                    alert("Error");
                }
            });
        }
    });

    $.fn.has_scrollbar = function() {
        var divnode = this.get(0);
        if(divnode.scrollHeight > divnode.clientHeight)
            return true;
    }

    /**
     * Fetch cushy list
     *
     */

    $.fn.fetchCushyList = function (trackPage) {
        setTimeout(function () {
            if(loading == false){
                loading = true;  //set loading flag on
                var userName = $.trim( $(document).find("#user_name").val() );
                var seckey = $.trim( $(document).find("#sec_key").val() );
                var searchKey = $.trim( $(document).find('#media-search-input').val() );
                console.log(userName +'___'+seckey);

                var $elm = $('.render-cushy-list');
                if (userName !== "" && seckey !== "") {
                    $.ajax({
                        method: "POST",
                        url: apiBaseUrl + "/api/v1/get_user_feeds",
                        data: { user_name: userName, security_key: seckey, page: trackPage, search_key:searchKey },
                        beforeSend: function () {
                            $('.pre-loader').show();
                            $('.media-selection, .cushy-overview').hide();
                            selectedItems = [];
                        },
                        dataType: "jsonp",
                        success:function(response){
                            loading = false; //set loading flag off once the content is loading
                            $('.pre-loader').hide();
                            $('button#loadMoreBtn').text('Load more');

                            if(response.success !== undefined && response.success == 1){
                                //console.info(response.data.records);
                                if (response.data.records !== undefined && response.data.records.length > 0) {
                                    var liContent = "";
                                    if (searchKey.length >0) {
                                        $('.render-cushy-list').html('');
                                    }

                                    $.each(response.data.records, function (index, value) {
                                        //console.log(response.data.records);
                                        liContent = '<li tabindex="0" role="checkbox" aria-label="'+ index +'" data-id="' + value.cushy_code + '" class="attachment save-ready select-item is-def-ite">' +
                                            '<div class="attachment-preview js--select-attachment type-image subtype-png landscape">' +
                                            '<div class="thumbnail" rel="' + value.cushy_code + '">' +
                                            '<div class="centered">' +
                                            '<img src="' + response.data.image_path + '/medium/' + value.media_name + '" draggable="false" alt="'+ value.media_name +'">' +
                                            '</div>' +
                                            '</div>' +
                                            '</div>' +
                                            '<button type="button" class="button-link check" tabindex="0"><span class="media-modal-icon"></span><span class="screen-reader-text">Deselect</span></button>' +
                                            '<input type="hidden" id="cushy_id'+ value.cushy_code +'" name="cushy_id[]" value="'+ value.cushy_code +'">' +
                                            '<input type="hidden" id="cushy_media'+ value.cushy_code +'" name="cushy_media[]" value="'+ response.data.image_path + '/large/' + value.media_name +'">' +
                                            '<input type="hidden" id="cushy_desc'+ value.cushy_code +'" name="cushy_desc[]" value="'+ value.description +'">' +
                                            '<input type="hidden" id="cushy_loc'+ value.cushy_code +'" name="cushy_loc[]" value="'+ value.location_name +'">' +
                                            '</li>';
                                        $elm.append( liContent );
                                    });

                                    if(response.data.next !== undefined && response.data.next >0) {
                                        var insertLoddBtn = '<li class="btn-load-wrap"><button type="button" id="loadMoreBtn" class="btn btn-md btn-core-btn">Load more</button></li>';
                                        $elm.append( insertLoddBtn );
                                    }
                                }
                            }else{
                                if (response.message !== undefined && response.message !== "") {
                                    $elm.html('<li class="error-holder">'+ response.message +'</li>');
                                }
                                else {
                                    if (response.data.records !== undefined && response.data.records.lenth === 0)
                                        $elm.html('<li class="error-holder">Oops!!! No record</li>');
                                }
                            }
                        },
                        error:function(){
                            console.log("Error");
                        }
                    });
                }
                else {
                    console.log('Cushy credentials are missing');
                }
            }
        }, 1000);
    }

    // fetch cushy list on add cushy button trigger
    $('#add-cushy-button').on('click', function () {
        trackPage = 1;
        selectedItems = [];
        cushyShortCode = "";
        $.fn.fetchCushyList(trackPage);
    })

    $this.on('keyup click', '#media-search-input', function (event) {
        var strLen = $.trim( $(this).val() );
        clearTimeout($.data(this, 'timer'));
        trackPage = 1;
        if (event.type == 'keyup' && strLen.length > 2) {
            $.fn.fetchCushyList(trackPage);
        }else {
            if (event.type == 'click' && strLen === 0 || strLen === 0) {
                $(this).data('timer', setTimeout(function () {
                    $.fn.fetchCushyList(trackPage);
                }, 500));
            }
        }
    })

    $this.on('click', 'button#loadMoreBtn', function(e) {
        $(this).attr('disabled', true).text('Loading...');
        trackPage++;
        $('.btn-load-wrap').fadeOut();
        $.fn.fetchCushyList(trackPage);
    })

    var isKeyPressed = false;
    var cushyShortCode = "";
    $this.on('click', 'li.select-item', function(e) {
        isKeyPressed = (e.ctrlKey || e.metaKey) ? true : false;
        var cushyId = $(this).attr('data-id');
        var isFound = $.inArray(cushyId, selectedItems);
        if (isFound >= 0) {
            selectedItems.splice(isFound, 1);
        } else {
            if (selectedItems.length === 5) {
                alert("You can select upto 5 Cushy's");
            }
            else {
                selectedItems.push(cushyId);
            }
        }

        $this.find('li.select-item').removeClass('selected details');
        if (selectedItems.length >0) {
            $.each(selectedItems, function (index, value) {
                $("[data-id='" + value + "']").addClass('selected');
            })
        }

        $(this).addClass('details');
        var numItemsSelected = selectedItems.length;

        if ( numItemsSelected > 0 ) {
            var cushyMedia = $(this).find('.thumbnail').attr('src');
            var cushyMedia = $("#cushy_media" + cushyId).val();
            var cushyDesc = $("#cushy_desc" + cushyId).val();
            var cushyLoc = $("#cushy_loc" + cushyId).val();
            //console.log(cushyMedia);
            $this.find('.cushy-overview').show();
            $this.find('.attachment-info .thumbnail-image img').attr('src', cushyMedia);
            $('input.cushy-media').val(cushyMedia);
            $('textarea.cushy-caption').val(cushyDesc);
            $('input.cushy-loc').val(cushyLoc);

            if (!$this.find('.return-btn').is(':visible')) {
                $('.media-selection').show();
            }

            $('.media-selection').find('.count').text(numItemsSelected +' selected');
            $this.find('.media-button-insert').attr('disabled', false);
        }
        else {
            $('.media-selection').hide();
            $this.find('.media-button-insert').attr('disabled', true);
        }
    })

    $this.on('click', '.edit-selection', function() {
        $this.find('.select-item').not('.selected').hide();
        $('.media-selection').hide();
        $this.find('.return-btn').show();
    })

    $this.on('click', '.clear-selection', function() {
        selectedItems = [];
        $this.find('.select-item').removeClass('selected details');
        $this.find('.media-button-insert').attr('disabled', true);
        $('.media-selection, .cushy-overview').hide();
    })

    $this.on('click', '.return-btn', function() {
        $(this).hide();
        $this.find('.select-item, .media-selection').show();
    })

    $(document).on('click', '.thumbnail', function() {
        $('body').removeClass('active-cushy');
        $(this).addClass('active-cushy');
    })

    $(document).on('click', '.media-button-insert', function() {
        if (selectedItems.length >0) {
            console.log(selectedItems);
            $(this).attr('disabled', false);
            $.each(selectedItems, function (index, value) {
                cushyShortCode += '[cushyview caption="' + $("#cushy_desc" + value).val() + '" id="'+ value + '"]\n';
            })
            wp.media.editor.insert( cushyShortCode );
            selectedItems = [];
        }else{
            $(this).attr('disabled', true);
            return false;
        }
    })

    $(document).on('click', '.media-modal-close', function() {
        trackPage = 1;
        selectedItems = [];
        cushyShortCode = "";
        $this.find('.select-item').removeClass('selected details');
        $this.find('#TB_window').fadeOut();
        $this.find('#TB_overlay').css({'background': 'transparent', 'opacity': 1});
    })

});