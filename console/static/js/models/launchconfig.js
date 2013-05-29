// launchconfig model
//

define([
  './eucamodel'
], function(EucaModel) {
  var model = EucaModel.extend({
    idAttribute: 'name',

    validation: {

      // ====================
      // API Reference: http://docs.aws.amazon.com/AWSSDKforPHP/latest/index.html#m=AmazonAS/create_launch_configuration
      // ====================         

      name: {
        rangeLength: [1, 255],
        required: true
      },
      image_id: {
        rangeLength: [1, 255],
        required: true
      },
      instance_type: {
        rangeLength: [1, 255],
        required: true
      },
      key_name: {
        rangeLength: [1, 255],
        required: false
      },
      security_groups: {
        required: false
      },
      user_data: {
        rangeLength: [0, 21847],
        required: false
      },
      kernel_id: {
        rangeLength: [1, 255],
        required: false
      },
      ramdisk_id: {
        rangeLength: [1, 255],
        required: false
      },
      block_device_mappings: {
        required: false
      },
      instance_monitoring: {
        required: false
      },
      spot_price: {
        pattern: /\d+\.\d+/,
        required: false
      },
      iam_instance_profile: {
        rangeLength: [1, 1600],
        required: false
      },
      ebs_optimized: {
        required: false
      },
      curlopts: {
        required: false
      },
      return_curl_handle: {
        oneOf: [ 'true', 'false' ],
        required: false
      },
    },

    sync: function(method, model, options) {
      var collection = this;
        if (method == 'create') {
          var name = model.get('name');
          var data = new Array();
          data.push({name: "_xsrf", value: $.cookie('_xsrf')});
          data.push({name: 'LaunchConfigurationName', value: name});
          if (model.get('image_id') != undefined)
            data.push({name: "ImageId", value: model.get('image_id')});
          if (model.get('key_name') != undefined)
            data.push({name: "KeyName", value: model.get('key_name')});
          if (model.get('user_data') != undefined)
            data.push({name: "UserData", value: model.get('user_data')});
          if (model.get('instance_type') != undefined)
            data.push({name: "InstanceType", value: model.get('instance_type')});
          if (model.get('kernel_id') != undefined)
            data.push({name: "KernelId", value: model.get('kernel_id')});
          if (model.get('ramdisk_id') != undefined)
            data.push({name: "RamdiskId", value: model.get('ramdisk_id')});
          if (model.get('block_device_mappings') != undefined) {
            var mappings = model.get('block_device_mappings');
            $.each(mappings, function(idx, mapping) {
              data.push({name: "BlockDeviceMapping."+(idx+1)+".DeviceName", value: mapping.device_name});
              if (mapping.virtual_name != undefined) {
                data.push({name: "BlockDeviceMapping."+(idx+1)+".VirtualName", value: mapping.virtual_name});
              }
              else {
                data.push({name: "BlockDeviceMapping."+(idx+1)+".Ebs.SnapshotId", value: mapping.snapshot_id});
                data.push({name: "BlockDeviceMapping."+(idx+1)+".Ebs.VolumeSize", value: mapping.volume_size});
              }
            });
          }
          if (model.get('instance_monitoring') != undefined)
            data.push({name: "InstanceMonitoring", value: model.get('instance_monitoring')});
          if (model.get('spot_price') != undefined)
            data.push({name: "SpotPrice", value: model.get('spot_price')});
          if (model.get('instance_profile_name') != undefined)
            data.push({name: "IamInstanceProfile", value: model.get('instance_profile_name')});

          var user_file = model.get('files') == undefined ? "none" : model.get('files');
          var self = this;

          $(model.get('fileinput')()).fileupload({
            url:"/autoscaling?Action=CreateLaunchConfiguration",
            formData: data,
            dataType:"json",
            fileInput: null,
            paramName: "user_data_file",
          });

          $(model.get('fileinput')()).fileupload("send", {
            files: user_file,
            success:
              function(data, textStatus, jqXHR){
                if ( data.results ) {
                  notifySuccess(null, $.i18n.prop('create_launch_config_run_success', DefaultEncoder().encodeForHTML(model.name), DefaultEncoder().encodeForHTML(data.results.request_id)));
                } else {
                  notifyError($.i18n.prop('create_launch_config_run_error', DefaultEncoder().encodeForHTML(model.name), DefaultEncoder().encodeForHTML(model.name)), undefined_error);
                }
              },
            error:
              function(jqXHR, textStatus, errorThrown){
                notifyError($.i18n.prop('create_launch_config_run_error', DefaultEncoder().encodeForHTML(model.name), DefaultEncoder().encodeForHTML(model.name)), getErrorMessage(jqXHR));
              }
          });
        }
        else if (method == 'delete') {
          var name = model.get('name');
          $.ajax({
            type:"POST",
            url:"/autoscaling?Action=DeleteLaunchConfiguration",
            data:"_xsrf="+$.cookie('_xsrf')+"&LaunchConfigurationName="+name,
            dataType:"json",
            async:true,
            success:
              function(data, textStatus, jqXHR){
                if ( data.results ) {
                  notifySuccess(null, $.i18n.prop('delete_launch_config_success', DefaultEncoder().encodeForHTML(name)));
                } else {
                  notifyError($.i18n.prop('delete_launch_config_error', DefaultEncoder().encodeForHTML(name)), undefined_error);
                }
              },
            error:
              function(jqXHR, textStatus, errorThrown){
                notifyError($.i18n.prop('delete_launch_config_error', DefaultEncoder().encodeForHTML(name)), getErrorMessage(jqXHR));
              }
          });
        }
      }
  });
  return model;
});
