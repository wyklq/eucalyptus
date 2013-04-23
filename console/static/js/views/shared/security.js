define([
  'app',
	'dataholder',
  'text!./security.html!strip',
  'rivets',
	], function( app, dataholder, template, rivets ) {
	return Backbone.View.extend({
    title: 'Security',

		initialize : function() {

      var self = this;
      var scope = {
        configmodel: this.model,
        keymodel: this.options.keymodel,
        sgroups: dataholder.sgroup,
        keypairs: dataholder.keypair,

        setSecurityGroup: function(e, item) {
          var groupWhere = this.sgroups.where({name: e.target.value});
          var group = _.find(groupWhere, function(sg) {
                        return sg.get('name') == e.target.value;
          });
          if(groupWhere.length > 0) {
              group.unset('tags');  // workaround - nested objects break next line
              self.model.set(group.toJSON());
              //self.model.set('id', group.get('id'));
              self.model.set('security_show', true);
              
          }
        },

        setKeyPair: function(e, item) {
          var keyWhere = this.keypairs.where({name: e.target.value});
          var key = _.find(keyWhere, function(k) {
                      return k.get('name') == e.target.value;
          });
          key.unset('tags'); // workaround - nested objects break next line
          this.keymodel.set(key.toJSON());
          self.model.set('security_show', true);
        },

        isKeySelected: function(obj) { 
          if (this.keymodel.get('name') == obj.keypair.get('name')) {
            return true;
          } 
          return false;
        },

        isGroupSelected: function(obj) { 
          if (this.configmodel.get('name') == obj.sgroup.get('name')) {
            return true;
          } 
          return false;
        },

        launchConfigErrors: {
          key: null,
          group: null
        },

        newKeyPair: function() {
            addKeypair( function(){ 
              console.log('returned from security group dialog');
              app.data.keypair.fetch();
            });
        },

        newSecGroup: function() {
          addGroup( function() {
              console.log('returned from security group dialog');
              app.data.sgroup.fetch();
            });
        }


      };
     
      self.model.on('validated:invalid', function(obj, errors) {
        scope.launchConfigErrors.group = errors.name;
        self.render();
      });

      self.model.on('validated:valid', function(obj, errors) {
        scope.launchConfigErrors.group = null;
        self.render();
      });

      this.options.keymodel.on('validated:invalid', function(obj, errors) {
        scope.launchConfigErrors.key = errors.name;
        self.render();
      });

      this.options.keymodel.on('validated:valid', function(obj, errors) {
        scope.launchConfigErrors.key = null;
        self.render();
      });

      app.data.sgroup.on('reset sync add remove change', function() {
        self.render();
      });

      app.data.keypair.on('reset sync add remove change', function() {
        self.render();
      });

      $(this.el).html(template)
      this.rView = rivets.bind(this.$el, scope);
      this.render();
		},

    render: function() {
      this.rView.sync();
    },

    isValid: function() {
      this.options.keymodel.validate(_.pick(this.options.keymodel.toJSON(), 'name'));
      if (!this.options.keymodel.isValid()) {
          return false;
      }
      this.model.validate(_.pick(this.model.toJSON(), 'name'));
      if(!this.model.isValid()) {
        return false;
      }
      return true;
    }
});
});