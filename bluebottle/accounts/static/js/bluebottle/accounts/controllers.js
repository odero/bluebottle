/*
 * Controllers
 */

App.SignupController = Ember.ObjectController.extend({
    isUserCreated: false,

    needs: "currentUser",

    actions: {
        createUser: function(user) {
            var self = this;

            user.on('didCreate', function() {
                self.set('isUserCreated', true);
            });

            // Change the model URL to the User creation API.
            user.set('url', 'users');
            user.save();
        }
    }
});


// Inspiration from:
// http://stackoverflow.com/questions/14388249/accessing-controllers-from-other-controllers
App.CurrentUserController = Ember.ObjectController.extend({
    init: function() {
        this._super();
        this.set("model", App.CurrentUser.find('current'));
    }
});


App.UserController = Ember.Controller.extend({
    needs: "currentUser"
});


App.UserProfileController = Ember.ObjectController.extend(App.Editable, {
    timeAvailableList: (function() {
        var list = Em.A();
        list.addObject({ name: '- - - - - - - - - - - - - - - - - -', value: ''});
        list.addObject({ name: gettext('1-4 hours per week'), value: '1-4_hours_week' });
        list.addObject({ name: gettext('5-8 hours per week'), value: '5-8_hours_week' });
        list.addObject({ name: gettext('9-16 hours per week'), value: '9-16_hours_week' });
        list.addObject({ name: gettext('1-4 hours per month'), value: '1-4_hours_month' });
        list.addObject({ name: gettext('5-8 hours per month'), value: '5-8_hours_month' });
        list.addObject({ name: gettext('9-16 hours per month'), value: '9-16_hours_month' });
        list.addObject({ name: gettext('I have all the time in the world. Bring it on!'), value: 'lots_of_time' });
        list.addObject({ name: gettext('It depends on the content of the tasks. Challenge me!'), value: 'depends' });
        return list;
    }).property(),

    updateCurrentUser: function(record) {
        var currentUser = App.CurrentUser.find('current');
        currentUser.reload();
    }
});


App.UserSettingsController = Em.ObjectController.extend(App.Editable, {
    userTypeList: (function() {
        var list = Em.A();
        list.addObject({ name: gettext('Person'), value: 'person'});
        list.addObject({ name: gettext('Company'), value: 'company'});
        list.addObject({ name: gettext('Foundation'), value: 'foundation'});
        list.addObject({ name: gettext('School'), value: 'school'});
        list.addObject({ name: gettext('Club / Association'), value: 'group'});
        return list;
    }).property()
});


App.UserOrdersController = Em.ObjectController.extend(App.Editable, {

    // Don't prompt the user to save if the 'fakeRecord' is set.
    stopEditing: function() {
        var record = this.get('model');
        if (!record.get('fakeRecord')) {
            this._super()
        }
    },

    recurringPaymentActive: '',

    // Initialize recurringPaymentActive
    initRecurringPaymentActive: function() {
        if (this.get('isLoaded')) {
            if (this.get('active')) {
                this.set('recurringPaymentActive', 'on')
            } else {
                this.set('recurringPaymentActive', 'off')
            }
        }
    }.observes('isLoaded'),

    updateActive: function() {
        if (this.get('recurringPaymentActive') != '') {
            this.set('active', (this.get('recurringPaymentActive') == 'on'));
        }
    }.observes('recurringPaymentActive')
});


App.UserModalController = Ember.ObjectController.extend({
    loadProfile: function() {
        var model = this.get('model');
        var id = model.get('id');

        if (id == "current") {
            // Get user id for current user
            id = model.get('id_for_ember');
        }

        this.set('model', App.User.find(id));
    }.observes('model')
});


App.LoginController = Em.Controller.extend({
    actions: {
        requestPasswordReset: function() {
            // Close previous modal, if any.
            $('.close').click();

            var modalPaneTemplate = '<div>{{view templateName="request_password_reset"}}</div>';

            Bootstrap.ModalPane.popup({
                classNames: ['modal'],
                defaultTemplate: Em.Handlebars.compile(modalPaneTemplate),

                callback: function(opts, e) {
                    if (opts.secondary) {
                        var $btn        = $(e.target),
                            $modal      = $btn.closest('.modal'),
                            $emailInput = $modal.find('#passwordResetEmail'),
                            $error      = $modal.find('#passwordResetError'),
                            email       = $emailInput.val();

                        $.ajax({
                            type: 'PUT',
                            url: '/api/users/passwordreset',
                            data: JSON.stringify({email: email}),
                            dataType: 'json',
                            contentType: 'application/json; charset=utf-8',
                            success: function() {
                                var message = gettext("YOU'VE GOT MAIL!<br /><br />We've sent you a link to reset your password, so check your mailbox.<br /><br />(No mail? It might have ended up in your spam folder)");
                                var $success = $("<p>" + message +"</p>");

                                $modal.find('.modal-body').html($success);
                                $btn.remove();
                            },
                            error: function(xhr) {
                                var error = $.parseJSON(xhr.responseText);
                                $error.html(error.email);
                                $error.removeClass('hidden');
                                $error.fadeIn();
                                $emailInput.addClass('error').val();
                                $emailInput.keyUp(function() {
                                    $error.fadeOut();
                                });
                            }
                        });

                        return false;
                    }
                }
            })
        }
    }
});

App.PasswordResetController = Ember.ObjectController.extend({
    needs: ['login'],

    resetDisabled: (function() {
        return !(this.get('new_password1') || this.get('new_password2'));
    }).property('new_password1', 'new_password2'),

    resetPassword: function(record) {
        var passwordResetController = this;

        record.one('didUpdate', function() {
            var loginController = passwordResetController.get('controllers.login');
            var view = App.LoginView.create({
                next: "/"
            });
            view.set('controller', loginController);

            loginController.set('post_password_reset', true);

            var modalPaneTemplate = '{{view view.bodyViewClass}}';

            Bootstrap.ModalPane.popup({
                classNames: ['modal'],
                defaultTemplate: Em.Handlebars.compile(modalPaneTemplate),
                bodyViewClass: view
            });
        });

        record.save();
    }
});


App.ProfileController = Ember.ObjectController.extend({
    addPhoto: function(file) {
        this.set('model.file', file);
    }
});

