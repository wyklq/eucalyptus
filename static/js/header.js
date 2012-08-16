/*************************************************************************
 * Copyright 2009-2012 Eucalyptus Systems, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 *
 * Please contact Eucalyptus Systems, Inc., 6755 Hollister Ave., Goleta
 * CA 93117, USA or visit http://www.eucalyptus.com/licenses/ if you need
 * additional information or have any questions.
 ************************************************************************/

(function($, eucalyptus) {
  $.widget('eucalyptus.header', {
    options : {
       logoUrl : 'images/eucalyptus_top.png',
       show_logo : true,
       show_navigation : false,
       show_help : false,
       show_user : false,
       show_search : false
    },
    _init : function(){
        var widget = this;
        this.element.show();
        this.element.children().each(function(idx) {
          if ($(this).attr('id')==='euca-navigator'){
            if(widget.options.show_navigation)
              $(this).show();
            else
              $(this).hide();
          }
          if ($(this).attr('id')==='euca-user'){
            if(widget.options.show_user){
              $(this).show();
            }
            else
              $(this).hide();
          }
          if ($(this).attr('id')==='euca-help'){
            if(widget.options.show_help){
              $(this).show();
            }
            else
              $(this).hide();
          }
          if ($(this).attr('id')=='euca-search'){
            if(widget.options.show_search)
              $(this).show(); 
            else
              $(this).hide();
          }
        });
    },

    _create : function(){
       var thisObj = this;
       // navigation area   
       var $naviArea = this.element.find('#euca-navigator');
       $naviArea.append($('<a>').attr('href','#').attr('id','resources-link').text(button_explorer));
       
       //help area 
       var $helpArea = this.element.find('#euca-help');

       var help_menus = {'documentation':menu_help_documentation,'forum':menu_help_forum,'report':menu_help_report}
       var $help_menus = $('<ul>');
       $.each(help_menus, function(k, v){
         $('<li>').append(
           $('<a>').attr('href','#').text(v).click(function(e,src){
             if(src!=='triggered')
               thisObj._trigger('select',e, {selected:k});
            })).appendTo($help_menus);
       });
       $helpArea.append(
         $('<ul>').addClass('header-nav').append(
           $('<li>').append(
             $('<a>').attr('href','#').text(menu_help).click(function(evt, src){ 
               	$helpArea.find('.header-nav ul').slideToggle('fast'); 
	        $(this).toggleClass('toggle-on');
                $('html body').trigger('click','help');
                if ($(this).hasClass('toggle-on'))
                  $('html body').eucaevent('add_click', 'help', evt);
                else
                  $('html body').eucaevent('del_click', 'help');
                return false;
             }),
             $help_menus)));
     

       //user area
       var user_menus = {'preference':menu_user_preferences,'aboutcloud':menu_user_aboutcloud,'logout':menu_user_logout}

       var uname =$.eucaData.u_session['account']+'/'+ $.eucaData.u_session['username'];
       var $userArea = this.element.find('#euca-user');
      
       var $user_menus = $('<ul>');
       $.each(user_menus, function(k, v){
         $('<li>').append(
           $('<a>').attr('href','#').text(v).click(function(e,src){
             if(src!=='triggered')
               thisObj._trigger('select',e, {selected:k});
            })).appendTo($user_menus);
       });
 
       $userArea.append(
         $('<ul>').addClass('header-nav').append(
           $('<li>').append(
             $('<a>').attr('href','#').text(uname).click(function(evt, src){
               $userArea.find('.header-nav ul').slideToggle('fast');
               $(this).toggleClass('toggle-on');
               $('html body').trigger('click', 'user');
               if ($(this).hasClass('toggle-on'))
                 $('html body').eucaevent('add_click', 'user', evt);
               else
                 $('html body').eucaevent('del_click', 'user');
               return false;
             }),
             $user_menus)));

        // event handlers
        var $navigator = $('#euca-navigator');
        $navigator.click(function (evt, src){
          $('#euca-explorer').slideToggle('fast'); 
          $navigator.toggleClass('toggle-on');
          $('html body').trigger('click','navigator');
          if ($navigator.hasClass('toggle-on')){
            $('html body').find('.euca-explorer-container .inner-container').explorer('onSlide');
            $('html body').eucaevent('add_click', 'navigator', evt);
          }
          else
            $('html body').eucaevent('del_click', 'navigator');
          return false;
        });
    },
   

   _destroy : function(){
    }
  });    
})(jQuery,
   window.eucalyptus ? window.eucalyptus : window.eucalyptus = {});
