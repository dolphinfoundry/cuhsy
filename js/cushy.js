/**
 * Created by Suman on 13/12/16.
 */

jQuery(function($) {
    var isDebug = false;
    var endpoint = (isDebug) ? 'dev.cushy.com' : 'cushy.com';
    var apiBaseUrl = 'http://' + endpoint;
    var $this = $(document);
    var pluginUrl = $this.find('input#pluginPath').val();
    var trackPage = 1;
    var loading = false;
    var selectedItems = [];
    var isResized = false;

    $(document).find(".cushy-preview").remove();

    $this.addClass('cushy-media-modal media-modal');
    $this.find('a#add-cushy-button').html('<img src="' + pluginUrl + '/assets/cushy-logo.png" alt="add cushy" style="width:18px; margin-top: -4px;" />Add cushy');

    $.fn.calculateAspectRatioFit = function(srcWidth, srcHeight, maxWidth, maxHeight) {
        var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
        return {
            width: srcWidth * ratio,
            height: srcHeight * ratio
        };
    };

    $.fn.loadIframeContents = function() {
        if (typeof $.fn.iFrameResize != 'undefined') {

        }
    }

    $(window).resize(function() {
        $.fn.loadIframeContents();
    });

    // Initialize the iframe content
    $.fn.loadIframeContents();

    $this.on('click', '#settingsSaveBtn', function() {
        var username = $.trim($("#username").val());
        var sec_key = $.trim($("#sec_key").val());
        if (username.length == 0) {
            $("#username").next(".field-error").text("Please enter Username");
            return false;
        } else if (sec_key.length == 0) {
            $("#sec_key").next(".field-error").text("Please enter Security Key");
            return false;
        } else {
            $.ajax({
                url: apiBaseUrl + '/sections/auth.php',
                data: {
                    username: username
                },
                beforeSend: function() {
                    $('#settingsSaveBtn').attr('disabled', true);
                },
                dataType: "jsonp",
                success: function(response) {
                    $('#settingsSaveBtn').attr('disabled', false);
                    if (response.success !== undefined && response.success == 1) {
                        $('#form').submit();
                        return true;
                    } else {
                        $("#username").focus();
                        $("#error").text("Sorry!!! Username does not match");
                    }
                },
                error: function() {
                    alert("Error");
                }
            });
        }
    });

    $.fn.has_scrollbar = function() {
        var divnode = this.get(0);
        if (divnode.scrollHeight > divnode.clientHeight)
            return true;
    }

    /**
     * Fetch the user posted cushy list
     *
     */

    $.fn.fetchCushyList = function(trackPage, isSearchCleared) {
        setTimeout(function() {
            if (loading == false) {
                loading = true; //set loading flag on
                var userName = $.trim($(document).find("#user_name").val());
                var seckey = $.trim($(document).find("#sec_key").val());
                var searchKey = $.trim($(document).find('#media-search-input').val());
                //console.log(userName +'___'+seckey);

                if (userName !== "" && seckey !== "") {
                    $.ajax({
                        method: "POST",
                        url: apiBaseUrl + "/api/v1/get_user_feeds",
                        data: {
                            user_name: userName,
                            security_key: seckey,
                            page: trackPage,
                            search_key: searchKey
                        },
                        beforeSend: function() {
                            if (searchKey.length > 0 || isSearchCleared !== undefined)
                                $.fn.searchFieldActions(true);
                            else
                                $('.pre-loader').show();
                        },
                        dataType: "jsonp",
                        success: function(response) { console.log(response);
                            $.fn.searchFieldActions(false);
                            loading = false; //set loading flag off once the content is loading
                            $('.pre-loader').hide();
                            $('button#loadMoreBtn').text('Load more');
                            if (response.success == 1 && response.data.records !== undefined && response.data.records.length > 0) {
                                var liContent = "";
                                if (searchKey.length > 0 || isSearchCleared !== undefined) {
                                    $('#TB_window').find('.render-cushy-list').find('li').not('li.pre-loader-content').remove();
                                }

                                $.each(response.data.records, function(index, value) {
                                    liContent = '<li tabindex="0" role="checkbox" aria-label="' + index + '" data-id="' + value.cushy_code + '" class="attachment save-ready select-item is-def-ite">' +
                                        '<div class="attachment-preview js--select-attachment type-image subtype-png landscape">' +
                                        '<div class="thumbnail cushy-lazy-bg" rel="' + value.cushy_code + '">' +
                                        '<div class="centered">' +
                                        '<img class="thumb-img" src="' + value.media_thumb.url + '" draggable="false" alt="N/A">' +
                                        '</div>' +
                                        '</div>' +
                                        '</div>' +
                                        '<button type="button" class="button-link check" tabindex="0"><span class="media-modal-icon"></span><span class="screen-reader-text">Deselect</span></button>' +
                                        '<input type="hidden" id="cushy_id' + value.cushy_code + '" name="cushy_id[]" value="' + value.cushy_code + '">' +
                                        '<input type="hidden" id="cushy_view_url' + value.cushy_code + '" name="cushy_view_url[]" value="' + value.view_url + '">' +
                                        '<input type="hidden" id="cushy_media' + value.cushy_code + '" name="cushy_media[]" value="' + value.media_large.url + '">' +
                                        '<input type="hidden" id="cushy_desc' + value.cushy_code + '" name="cushy_desc[]" value="' + value.description + '">' +
                                        '<input type="hidden" id="cushy_loc' + value.cushy_code + '" name="cushy_loc[]" value="' + value.location_name + '">' +
                                        '<input type="hidden" id="cushy_date' + value.cushy_code + '" name="cushy_date[]" value="' + value.cushy_time + '">' +
                                        '<input type="hidden" id="cushy_tags' + value.cushy_code + '" name="cushy_tags[]" value="' + value.tags + '">' +
                                        '<input type="hidden" id="cushy_img_data' + value.cushy_code + '" name="cushy_img_data[]" value="' + value.media_large.width + 'x' + value.media_large.height + '">'
                                    '</li>';

                                    $this.find('#TB_window').find('.render-cushy-list').append(liContent);
                                });

                                $this.find('#TB_window').find('.render-cushy-list').find("img.thumb-img").load(function() {
                                    this.style.opacity = 1;
                                });

                                if (response.data.next !== undefined && response.data.next > 0 && response.data.records.length >= 20) {
                                    var insertLoddBtn = '<li class="btn-load-wrap"><button type="button" id="loadMoreBtn" class="btn btn-md btn-core-btn">Load more</button></li>';
                                    $('#TB_window').find('.render-cushy-list').append(insertLoddBtn);
                                }
                            } else {
                                if (response.message !== undefined && response.message !== "") {
                                    $('#TB_window').find('.render-cushy-list').html('<li class="error-holder">' + response.message + '</li>');
                                } else {
                                    if (response.data.records != undefined && response.data.records.length == 0)
                                        $('#TB_window').find('.render-cushy-list').html('<li class="error-holder">No matching cushys</li>');
                                }
                                $this.find('.clear-selection').trigger('click');
                            }
                        },
                        error: function() {
                            console.log("Error fetching data");
                        }
                    });
                } else {
                    console.log('Cushy credentials are missing');
                }
            }
        }, 500);
    }

    // fetch cushy list on add cushy button trigger
    $('#add-cushy-button').on('click', function() {
        trackPage = 1;
        selectedItems = [];
        cushyShortCode = "";
        $.fn.fetchCushyList(trackPage);
    })

    var isSearched = false;
    $this.on('keyup click', '.cushy-search-input', function(event) {
        var strLen = $.trim($(this).val());
        clearTimeout($.data(this, 'timer'));
        trackPage = 1;

        if (event.type == 'keyup' && (strLen.length > 2 || strLen.length === 0)) {
            isSearched = true;
            $(this).data('timer', setTimeout(function() {
                $.fn.fetchCushyList(trackPage, isSearched);
            }, 200));
        }

        if (event.type == 'click' && strLen.length > 0 && isSearched) {
            isSearched = false;
            $(this).data('timer', setTimeout(function() {
                $.fn.fetchCushyList(trackPage, isSearched);
            }, 200));
        }
    })

    $this.on('click', '.search-close-icon', function(event) {
        //$.fn.searchFieldActions(true);
        $this.find('.cushy-search-input').val('');
        trackPage = 1;
        $.fn.fetchCushyList(trackPage, false);
    })

    $.fn.searchFieldActions = function (showLoader) {
        if (showLoader) {
            $this.find('.search-fld-btn').addClass('search-load-icon').removeClass('search-close-icon');
        }
        else {
            if($this.find('.cushy-search-input').val().length > 0) {
                $this.find('.search-fld-btn').addClass('search-close-icon').removeClass('search-load-icon');
            }else
                $this.find('.search-fld-btn').removeClass('search-load-icon search-close-icon');
        }
    }


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
            } else {
                selectedItems.push(cushyId);
            }
        }

        $this.find('li.select-item').removeClass('selected details');
        if (selectedItems.length > 0) {
            $.each(selectedItems, function(index, value) {
                $("[data-id='" + value + "']").addClass('selected');
            })
        }

        $(this).addClass('details');
        var numItemsSelected = selectedItems.length;

        if (numItemsSelected > 0) {
            var cushyMedia = $(this).find('.thumbnail').attr('src');
            var cushyMedia = $("#cushy_media" + cushyId).val();
            var cushyDesc = $("#cushy_desc" + cushyId).val();
            var cushyLoc = $("#cushy_loc" + cushyId).val();
            var cushyDate = $("#cushy_date" + cushyId).val();

            $this.find('.cushy-overview').show();
            $this.find('.attachment-info .thumbnail-image img').attr('src', cushyMedia);
            $('input.cushy-media').val(cushyMedia);
            $('textarea.cushy-caption').val( cushyDesc.replace(/\\/g, '') );
            $('input.cushy-loc').val( cushyLoc.replace(/\\/g, '') );
            $('input.cushy-date').val(cushyDate);

            var buggleTagsList = $("#cushy_tags" + cushyId).val();
            if (buggleTagsList !== "") {
                /*tags = tagsList.split(',');
                 if (tags.length >1) {
                 var tagsElm = '<ul class="tags-list">';
                 for(var i=0; i<tags.length; i++) {
                 tagsElm += '<li>' + tags[i] + '</li>';
                 }
                 tagsElm += '</ul>';
                 $('.tags-block').css('display', 'block').find('.cushy-tags').html(tagsElm);
                 //console.log(tagsElm);
                 } */
                $('.tags-block').css('display', 'block').find('.cushy-tags').html(buggleTagsList);

            }
            else $('.tags-block').css('display', 'none').find('.cushy-tags').html('');

            if (!$this.find('.return-btn').is(':visible')) {
                $('.media-selection').show();
            }

            $('.media-selection').find('.count').text(numItemsSelected + ' selected');
            $this.find('.media-button-insert').attr('disabled', false);
        } else {
            $('.media-selection').hide();
            $this.find('.media-button-insert').attr('disabled', true);
        }
    })

    $this.on('click', '.edit-selection', function() {
        $this.find('.select-item').not('.selected').hide();
        $this.find('.media-selection, button#loadMoreBtn').hide();
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
        $this.find('.select-item, .media-selection, button#loadMoreBtn').show();
    })

    $(document).on('click', '.thumbnail', function() {
        $('body').removeClass('active-cushy');
        $(this).addClass('active-cushy');
    })

    $(document).on('click', '.media-button-insert', function() {
        if (selectedItems.length > 0) {
            $(this).attr('disabled', false);
            $.each(selectedItems, function(index, value) {
                var imgWH = $("#cushy_img_data" + value).val();
                cushyShortCode += '<div class="cushy-card" style="display: none">[cushyview caption="' + $("#cushy_desc" + value).val() + '" id="' + value + '" img_data="' + imgWH + '"]\n</div>';
                var img_wh = imgWH.split("x");
                var ifWidth = 320;
                var ifHeight = 480;
                if (img_wh !== undefined && img_wh[0] !== undefined) {
                    if (img_wh[0] > img_wh[1]) {
                        ifWidth = 480;
                        ifHeight = 320;
                    }
                }

                cushyShortCode += '<iframe class="cushy-preview" src="' + $("#cushy_view_url" + value).val() + '" width="'+ ifWidth +'" height="'+ ifHeight +'" style="background: #D8D8D8 url(' + pluginUrl + '/assets/loader.png) no-repeat center center; margin-bottom: 0 !important;"></iframe>';
            })
            wp.media.editor.insert(cushyShortCode);
            selectedItems = [];
            setTimeout(function () {
                $(document).find(".cushy-preview").css('margin-bottom', 0);
            }, 1000);
        } else {
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
        $this.find('#TB_overlay').css({
            'background': 'transparent',
            'opacity': 1
        });
    })

});