<?php
/*
Plugin Name: Cushy.com User Content
Plugin URI: http://cushy.com/wordpress
Description: a plugin to get your specific cushy.com user content into your blogs.
Version: 0.1a
Author: Foog Yllis, Suman Perumal, Nandish Gowda
Author URI: http://cushy.com
License: GPL2
*/


global $cushy_db_version;
$cushy_db_version = "1.0";
define('CUSHY_BASE_URL', 'http://cushy.com');
define('PLUGIN_PATH', '/wp-content/plugins/');
define('PLUGIN_URL', plugin_dir_url( __FILE__ ));
define('PLUGIN_NAME', 'cushy-master');

function my_plugin_create_db() {

    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();
    $table_name = $wpdb->prefix . 'my_analysis';

    $sql = "CREATE TABLE $table_name (
		id mediumint(9) NOT NULL AUTO_INCREMENT,
		time datetime DEFAULT '0000-00-00 00:00:00' NOT NULL,
		views smallint(5) NOT NULL,
		clicks smallint(5) NOT NULL,
		UNIQUE KEY id (id)
	) $charset_collate;";

    require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
    dbDelta( $sql );
}

register_activation_hook(__FILE__,'my_plugin_create_db');


function cushy_install() {
    global $wpdb;
    global $cushy_db_version;

    $table_name = $wpdb->prefix . "cushy_settings";

    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
      id mediumint(9) NOT NULL AUTO_INCREMENT,
      user_name tinytext NOT NULL,
      security_key VARCHAR(55) NOT NULL,
      url text NOT NULL,
      UNIQUE KEY id (id)
    ) ENGINE=InnoDB  DEFAULT COLLATE=latin1_general_ci;";

    $wpdb->query($sql);

}
register_activation_hook(__FILE__,'cushy_install');



/*
function test_new() {
    global $wpdb;
    global $cushy_db_version;

    $your_db_name = $wpdb->prefix . 'cushy_settings';

        $sql = "CREATE TABLE " . $your_db_name . " (
		'id' mediumint(9) NOT NULL AUTO_INCREMENT,
		'user_name' mediumtext NOT NULL,
		'security_key'  VARCHAR(55) NOT NULL,
		'url' text NOT NULL,
		UNIQUE KEY id (id)
		);";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);


}

register_activation_hook(__FILE__,'test_new');

*/


/* drop table when plugin is deactivated */

function remove_cushy_settings_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . "cushy_settings";
    $sql = "DROP TABLE IF EXISTS $table_name;";
    $wpdb->query($sql);
    delete_option("my_plugin_db_version");
}
register_deactivation_hook( __FILE__, 'remove_cushy_settings_table' );



/* add cushy settings to menu */

add_action('admin_menu', 'cushy_settings_menu');

function cushy_settings_menu(){
    add_menu_page( 'Cushy Settings Page', 'Cushy Settings', 'manage_options', 'cushy-settings', 'cushy_settings' );
}

function include_cushy_js_file() {
    wp_enqueue_script('iframeResizer', PLUGIN_URL .'/js/iframeResizer.min.js', array(), '2.0.'.time(), true);
    wp_enqueue_script('cushy', PLUGIN_URL .'/js/cushy.js', array(), '1.0.'.time(), true);
}

function cushy_settings(){
    include_cushy_js_file();
    ?>

    <div class="wrap">
        <h1><?php if(isset($title)) echo esc_html($title); ?></h1>

        <form action="#" method="post" novalidate="novalidate" id="form">
            <?php settings_fields('cushy'); ?>

            <?php
            global $wpdb;

            $tablename = $wpdb->prefix.'cushy_settings';

            $results = $wpdb->get_results( "SELECT * FROM $tablename");
            if($results){
                foreach ($results as $res){
                    ?>
                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="username">User Name</label></th>
                            <td>
                                <input name="username" type="text" id="username" value="<?php echo $res->user_name; ?>" class="regular-text" />
                                <span id="error" style="color: red;"></span>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="sec_key">Security Key</label></th>
                            <td>
                                <input name="sec_key" type="text" id="sec_key" value="<?php echo $res->security_key; ?>" class="regular-text" />
                                <span id="error" style="color: red;"></span>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="username">Blog URL</label></th>
                            <td>
                                <input name="blog_url" type="text" id="blog_url" value="<?php echo $res->url; ?>" class="regular-text" />

                            </td>
                        </tr>

                    </table>


                <?php }

            }else{

                ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="username">User Name</label></th>
                        <td>
                            <input name="username" type="text" id="username" value="" class="regular-text" />
                            <span id="error" style="color: red;"></span>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="sec_key">Security Key</label></th>
                        <td>
                            <input name="sec_key" type="text" id="sec_key" value="" class="regular-text" />
                            <span id="error" style="color: red;"></span>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="username">Blog URL</label></th>
                        <td>
                            <input name="blog_url" type="text" id="blog_url" value="" class="regular-text" />

                        </td>
                    </tr>

                </table>

            <?php } ?>

            <?php do_settings_sections('cushy'); ?>


            <input  id="test" class="button button-primary" value="Save Changes" type="button">
        </form>


        <?php
        if ($_POST){

            global $wpdb;

            $tablename = $wpdb->prefix.'cushy_settings';

            $results = $wpdb->get_results( "SELECT * FROM $tablename");

            if($results){

                #$wpdb->query($wpdb->prepare("UPDATE $tablename SET user_name='".$_POST['username']."', security_key='".$_POST['sec_key']."', url='".$_POST['blog_url']."' WHERE id != 0"));
                $wpdb->update(
                    $tablename,
                    array(
                        'user_name' => $_POST['username'],
                        'security_key' => $_POST['sec_key'],
                        'url' => $_POST['blog_url']
                    ),
                    array( 'id'=> 1 )
                );
                #$wpdb->query($wpdb->prepare("UPDATE $tablename SET time='$current_timestamp' WHERE userid=$userid"));
                echo "<meta http-equiv='refresh' content='0'>";

            }else{

                $data=array(
                    'user_name' => $_POST['username'],
                    'security_key' => $_POST['sec_key'],
                    'url' => $_POST['blog_url'] );

                $wpdb->insert( $tablename, $data);

                echo "<meta http-equiv='refresh' content='0'>";
            }

        }
        ?>

    </div>


    <?php
}

function add_cushy_button()
{
    ?>

    <a href="<?php
    echo add_query_arg(array(
        'action' => 'cushy_add',
        'width' => '500'
    ), admin_url('admin-ajax.php'));
    ?>"
       id="add-cushy-button" class="button add_media thickbox" title="Add Cushys to your story">Add a Cushy</a>
    <input type="hidden" id="pluginPath" value="<?php
    echo PLUGIN_URL;
    ?>">
    <?php
}

add_action('media_buttons', 'add_cushy_button', 11);

function include_cushy_button_js_file() {
    wp_enqueue_style('cushy', PLUGIN_PATH . PLUGIN_NAME . '/css/cushy.css', false, '1.0' . time());
    wp_enqueue_script('cushy', PLUGIN_PATH . PLUGIN_NAME . '/js/cushy.js', array(), '1.0.'.time(), true);
}

add_action( 'wp_enqueue_media', 'include_cushy_button_js_file' );
add_action( 'wp_ajax_cushy_add', 'cushy_add' );
add_action( 'wp_ajax_nopriv_cushy_add', 'cushy_add' );

function cushy_add() {
    $get_cushy_access = getWpData();
    $user_name = (isset($get_cushy_access['user_name'])) ? $get_cushy_access['user_name'] : "";
    $security_key = (isset($get_cushy_access['security_key'])) ? $get_cushy_access['security_key'] : "";
    $template_string = '
    
    <button type="button" class="button-link media-modal-close"><span class="media-modal-icon"><span class="screen-reader-text">Close media panel</span></span></button>
    <div class="media-modal-content cushy-media-modal">
    <div class="media-frame mode-select wp-core-ui" id="__wp-uploader-id-0">
    <div class="media-frame-title">
       <h1>Add Cushy pictures to your story</h1>
    </div>
    <div class="media-frame-contents">
    <div class="media-frame-content-items">
       <div class="widefat">
          <div id="listContainer" class="list-container">
             <!--<h1>Content loader</h1>
              <button type="button" id="test">Click</button>-->
             <div class="media-frame-content" data-columns="4">
                <div class="attachments-browser">
                   <div class="media-toolbar">
                      <button type="button" class="button media-button button-large media-button-backToLibrary return-btn" style="display: none">← Return to Cushy list</button>
                      <div class="media-toolbar-primary search-form"><label for="media-search-input" class="screen-reader-text">Search Cushy</label><input type="search" placeholder="Search cushy..." id="media-search-input" class="search"></div>
                   </div>
                   <div
                   <div class="pre-loader" style="display: block">
                      <img src="'.PLUGIN_URL.'/assets/loader.gif" alt="cushy loader">
                    </div>
                   
                   <div class="media-dynamic-content">
                     <ul tabindex="-1" class="attachments ui-sortable ui-sortable-disabled render-cushy-list" id="__attachments-view-250"></ul>
                   </div>
                   
                   <div class="media-sidebar visible">
                      <div class="media-uploader-status" style="display: none;">
                         <h2>Uploading</h2>
                         <button type="button" class="button-link upload-dismiss-errors"><span class="screen-reader-text">Dismiss Errors</span></button>
                         <div class="media-progress-bar">
                            <div></div>
                         </div>
                         <div class="upload-details">
                            <span class="upload-count">
                            <span class="upload-index"></span> / <span class="upload-total"></span>
                            </span>
                            <span class="upload-detail-separator">–</span>
                            <span class="upload-filename"></span>
                         </div>
                         <div class="upload-errors"></div>
                      </div>
                      <div tabindex="0" data-id="1491" class="attachment-details save-ready cushy-overview" style="display: none">
                         <h2>
                            Attachment Details			<span class="settings-save-status">
                            <span class="spinner"></span>
                            <span class="saved">Saved.</span>
                            </span>
                         </h2>
                         <div class="attachment-info">
                            <div class="thumbnail thumbnail-image">
                               <img src="http://192.168.0.112/cushy_dev/useruploads//thumb/7716555372b8385780a117ebc24ec49b.jpg" draggable="false" alt="">
                            </div>
                            <div class="details" style="display: none">
                               <div class="filename">2.png</div>
                               <div class="uploaded">February 13, 2017</div>
                               <div class="file-size"></div>
                               <div class="dimensions">629 × 530</div>
                            </div>
                         </div>
                         <label class="setting" data-setting="url">
                         <span class="name">URL</span>
                         <input type="text" class="cushy-media" value="http://localhost/cushy_blog/wp-content/uploads/2017/02/2.png" readonly>
                         </label>
                         <!--<label class="setting" data-setting="title">
                         <span class="name">Memory</span>
                         <input type="text" value="Cushy bubbles goes here">
                         </label>-->
                         <label class="setting" data-setting="caption">
                         <span class="name">Caption</span>
                         <textarea class="cushy-caption" readonly></textarea>
                         </label>
                         <label class="setting" data-setting="alt">
                         <span class="name">Place</span>
                         <input type="text" class="cushy-loc" readonly>
                         </label>
                      </div>
                      <form class="compat-item"></form>
                      <div class="attachment-display-settings" style="display: none">
                         <h2>Attachment Display Settings</h2>
                         <label class="setting">
                            <span>Alignment</span>
                            <select class="alignment" data-setting="align" data-user-setting="align">
                               <option value="left">
                                  Left					
                               </option>
                               <option value="center">
                                  Center					
                               </option>
                               <option value="right">
                                  Right					
                               </option>
                               <option value="none" selected="">
                                  None					
                               </option>
                            </select>
                         </label>
                         <div class="setting">
                            <label>
                               <span>Link To</span>
                               <select class="link-to" data-setting="link" data-user-setting="urlbutton">
                                  <option value="none" selected="">
                                     None					
                                  </option>
                                  <option value="file">
                                     Media File					
                                  </option>
                                  <option value="post">
                                     Attachment Page					
                                  </option>
                                  <option value="custom">
                                     Custom URL					
                                  </option>
                               </select>
                            </label>
                            <input type="text" class="link-to-custom hidden" data-setting="linkUrl">
                         </div>
                         <label class="setting">
                            <span>Size</span>
                            <select class="size" name="size" data-setting="size" data-user-setting="imgsize">
                               <option value="thumbnail">
                                  Thumbnail – 150 × 150
                               </option>
                               <option value="medium">
                                  Medium – 300 × 253
                               </option>
                               <option value="full" selected="selected">
                                  Full Size – 629 × 530
                               </option>
                            </select>
                         </label>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
    <div class="media-frame-toolbar">
       <div class="media-toolbar">
          <div class="media-toolbar-secondary">
             
             <div class="media-selection" style="display: none">
                <div class="selection-info">
                    <span class="count"></span>
                    <button type="button" class="button-link edit-selection">Edit Selection</button>
                    <button type="button" class="button-link clear-selection">Clear</button>
                </div>
                <div class="selection-view" style="display: none;">
                    <ul tabindex="-1" class="attachments" id="__attachments-view-76">
                        <li tabindex="0" role="checkbox" aria-label="4" aria-checked="true" data-id="1486" class="attachment selection save-ready">
                            <div class="attachment-preview js--select-attachment type-image subtype-png landscape">
                                <div class="thumbnail">
                                    <div class="centered">
                                        <img src="http://localhost/cushy_blog/wp-content/uploads/2017/02/4-300x248.png" draggable="false" alt="">
                                        </div>
                                    </div>
                                </div>
                            </li>
                            <li tabindex="0" role="checkbox" aria-label="4" aria-checked="true" data-id="1485" class="attachment selection save-ready">
                                <div class="attachment-preview js--select-attachment type-image subtype-png landscape">
                                    <div class="thumbnail">
                                        <div class="centered">
                                            <img src="http://localhost/cushy_blog/wp-content/uploads/2017/02/4-1-300x248.png" draggable="false" alt="">
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li tabindex="0" role="checkbox" aria-label="2" aria-checked="true" data-id="1491" class="attachment selection save-ready">
                                    <div class="attachment-preview js--select-attachment type-image subtype-png landscape">
                                        <div class="thumbnail">
                                            <div class="centered">
                                                <img src="http://localhost/cushy_blog/wp-content/uploads/2017/02/2-300x253.png" draggable="false" alt="">
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
              </div>
             
          </div>
          <div class="media-toolbar-primary search-form">
             <button type="button" class="button media-button button-primary button-large media-button-insert" id="insert" disabled>Insert into post</button>
          </div>
       </div>
    </div>';

    $template_string .= '<input type="hidden" id="user_name" value="'.$user_name.'">
    <input type="hidden" id="sec_key" value="'.$security_key.'">';

    //$template_string .= '<script src="'.plugin_dir_url().'cushy/js/cushy.js?v=1"></script>';
    echo $template_string; exit();
}

function include_iframe_js_file() {
    wp_enqueue_script('iframeResizer', PLUGIN_URL . '/js/iframeResizer.min.js', array(), '2.0.'.time(), true);
}

//add_action( 'wp_iframe_content', 'include_iframe_js_file' );

function cushy_view($atts) {

    if (count($atts) >0) {
        $cushy_card = '<div class="iframe-content" style="left: 0px; width: 100%; height: auto; position: relative;">
                        <iframe id="'.$atts['id'].'" class="cushy-iframe embed-responsive-item" src="'.CUSHY_BASE_URL.'/sections/view/'.$atts['id'].'" frameborder="0" allowfullscreen style="width:100%;height:100%;">
                        </iframe>
                        </div>';
        $cushy_card .= '<script src="'.PLUGIN_URL.'/js/iframeResizer.min.js?v=1"></script>';
        $cushy_card .= '<script src="'.PLUGIN_URL.'/js/cushy.js?v=1"></script>';
    }
    else $cushy_card = "";

    return $cushy_card;
}

add_shortcode('cushyview','cushy_view');

function getWpData() {
    global $wpdb;
    $user_credentials = $wpdb->get_row("SELECT * FROM wp_cushy_settings");
    $user_name = (isset($user_credentials->user_name)) ? $user_credentials->user_name : "";
    $sec_key = (isset($user_credentials->security_key)) ? $user_credentials->security_key : "";
    return array('user_name' => $user_name, 'security_key' => $sec_key);
}

getWpData();

?>

<script>
    /*function resizeIFrameToFitContent( iFrame ) {
     iFrame.width  = iFrame.contentWindow.document.body.scrollWidth;
     iFrame.height = iFrame.contentWindow.document.body.scrollHeight;
     }

     window.addEventListener('DOMContentReady', function(e) {
     var iFrame = document.getElementById( 'iframe' );
     resizeIFrameToFitContent( iFrame );

     var iframes = document.querySelectorAll("iframe");
     for( var i = 0; i < iframes.length; i++) {
     resizeIFrameToFitContent( iframes[i] );
     }
     }); */
</script>