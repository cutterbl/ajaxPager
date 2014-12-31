!function ($) {

  "use strict"; // jshint ;_;


 /* BUTTON PUBLIC CLASS DEFINITION
  * ============================== */

  var ajaxPager = function (element, options) {
    this.$element = $(element);
    this.options = $.extend(true, {}, $.fn.pager.defaults, options);
    this.private = $.fn.pager.privatevars;
    
    this.$element.on("optionchange", $.proxy(this._optionChange, this));
    this.render();
  };
  
  ajaxPager.prototype = {
    constructor: ajaxPager
    
    , render: function () {
      // Create some UI
      var barUI = this._buildPagerBar(this.options);
      this.$element.wrap('<div class="ajaxPagerContainer" />').addClass('pagingContent');
      switch (this.options.position) {
        case "both":
          this.$element.before(barUI).after(barUI);
          break;
        case "top":
          this.$element.before(barUI);
          break;
        case "bottom":
          this.$element.after(barUI);
          break;
      }
      
      this.$container = this.$element.parent();
      this.$pagingbar = this.$container.children(".ajaxPager");
      this.$pagingbar.on("click.pager.data-api", "a.paging-nav:not('.disabled')", $.proxy(this._changePage, this));
      this.$pageinputs = $("input[name=page]", this.$pagingbar);
      this.$pageinputs.on("keypress.pager.data-api", $.proxy(this._pageKeyPress, this));
      this.$startlinks = $("a.startlink", this.$pagingbar);
      this.$endlinks = $("a.endlink", this.$pagingbar);
      if (this.options.limitdd) {
        this.$limitdd = $("ul.limitdd", this.$pagingbar);
        this.$limitdd.on("click.pager.data-api", "li>a", $.proxy(this._updateLimit, this));
      }
      if (!$.isEmptyObject(this.options.sortby)) {
        this.$sortby = $("ul.sortby", this.$pagingbar);
        this.$sortby.on("click.pager.data-api", "li>a", $.proxy(this._updateSort, this));
      }
      this.$firstrecordcount = $("span.first-record", this.$pagingbar);
      this.$lastrecordcount = $("span.last-record", this.$pagingbar);
      this.$totalrecordcount = $("span.record-count", this.$pagingbar);
      this.$totalpagecount = $("span.total-pages", this.$pagingbar);
      this.start = 0;
      this.end = 0;
      
      this.$element.trigger('init').trigger('render');
      
      this._makeRequest();
      
    }
  
    , _changePage: function (e) {
      e.preventDefault();
      var lnk = $(e.currentTarget)
          , data = lnk.data();
      this[data.pagingaction]();
      return false;
    }
  
    , first: function () {
      this.options.page = 1;
      this.$element.trigger('pagechange', this.options.page);
      this._makeRequest();
    }
    
    , previous: function () {
      this.options.page--;
      this.$element.trigger('pagechange', this.options.page);
      this._makeRequest();
    }
    
    , next: function () {
      this.options.page++;
      this.$element.trigger('pagechange', this.options.page);
      this._makeRequest();
    }
    
    , last: function () {
      this.options.page = this.private.totalpages;
      this.$element.trigger('pagechange', this.options.page);
      this._makeRequest();
    }
    
    , reload: function (page) {
      page = page || 1
      this.options.page = page;
      this.$element.trigger('pagechange', this.options.page);
      this.$pageinputs.val(page);
      this._makeRequest();
    }
    
    , _renderData: function () {
      this.private.firstrecord = ((this.options.page - 1) * this.options.limit) + 1;
      var end = (this.private.firstrecord + this.options.limit) - 1;
      this.private.lastrecord = (end < this.private.totalrecords) ? end : this.private.totalrecords;
      this.private.totalpages = Math.ceil(this.private.totalrecords/this.options.limit);
      
      this._setState();
    }
    
    , _setState: function () {
      this.$pageinputs.val(this.options.page);
      this.$totalpagecount.text(this.private.totalpages);
      this._updatePageButtons();
      this.$firstrecordcount.text(this.private.firstrecord);
      this.$lastrecordcount.text(this.private.lastrecord);
      this.$totalrecordcount.text(this.private.totalrecords);
    }
    
    , _pageKeyPress: function (e) {
      if (e.which !== 8) { // if the keypress isn't a backspace
        if (e.which !== 13) { // if the keypress isn't enter
          var self = this
            , $target = $(e.currentTarget)
            , _key = [48,49,50,51,52,53,54,55,56,57]
            , char = $.inArray(e.which, _key) // was the keypress a number? which one?
            , currVal = this.$pageinputs.val();
          if (char !== -1) {
            setTimeout(function() {
              var val = $target.val();
              self.$pageinputs.val((val <= self.private.totalpages) ? val : currVal); // if the value is more than the total number of pages, we need to go back
            }, 100);
          } else { // we'll just prevent anything non-numeric
            e.preventDefault();
            return false;
          }
        } else {
          e.preventDefault();
          var val = $(e.currentTarget).val();
          this.reload(val);
          return false;
        }
      }
    }
    
    , _updatePageButtons: function () {
      this.$startlinks.parent().toggleClass("disabled", (this.options.page === 1));
      this.$endlinks.parent().toggleClass("disabled", (this.options.page === this.private.totalpages));
    }
    
    , _updateLimit: function (e) {
      e.preventDefault();
      var el = $(e.currentTarget)
        , data = el.data()
        , val = data.limit
        , itags = $("li>a>i", this.$limitdd);
      this.options.limit = val;
      itags.removeClass("glyphicon glyphicon-chevron-right").addClass("glyphicon glyphicon-");
      el.children("i").removeClass("glyphicon glyphicon-").addClass("glyphicon glyphicon-chevron-right");
      el.closest("li.dropdown.open").removeClass("open");
      this.reload();
      return false;
    }
    
    , _updateSort: function (e) {
      e.preventDefault();
      var self = this
        , el = $(e.currentTarget)
        , settings = this.options
        , itags = $("li>a>i", this.$sortby)
        , currClass = $("i", el).attr("class")
        , data = el.data() // data of the link that was clicked
        , icnUp = "glyphicon glyphicon-arrow-up"
        , icnDwn = "glyphicon glyphicon-arrow-down"
        , iPlcr = "icon-"
        , newIcon = icnDwn;
      
      itags.removeClass(icnUp).removeClass(icnDwn).addClass(iPlcr);
      
      settings.sortcolumn = data.sortcol;
      if (currClass === icnUp) {
        settings.sortdir = "desc";
        newIcon = icnDwn;
      } else if (currClass === icnDwn) {
        settings.sortdir = "asc";
        newIcon = icnUp;
      } else {
        settings.sortdir = "desc";
      }
      
      $("i", el).removeClass(iPlcr).addClass(newIcon);
      el.closest("li.dropdown.open").removeClass("open");
      this.reload();
      return false;
    }
    
    ,  option: function (options) {
      var $self = this.$element
        , settings = this.options
        , orig = $.extend({}, settings);
      if (typeof options === 'object'){
        settings = $.extend(true, settings, options);
      } else if (arguments.length === 2) {
        settings[arguments[0]] = arguments[1];
      } else {
        return settings[arguments[0]];
      }
      $.each(orig, function(ind,el){
        if(settings[ind]!==el){
          $self.trigger('optionchange', [ind, el, settings[ind]]);
        }
      })
      return;
    }
   
    , _optionChange: function (event, option, oldvalue, newvalue) {
      var $self = this.$element
        , settings = this.options
        , pSettings = this.private
        , data = $self.data('ajaxPager');
      switch (option) {
        case "page":
          if (newvalue > pSettings.totalpages) {
            settings.page = oldvalue;
            this.$pageinputs.val(oldvalue);
            $.error( 'You have tried to set a \"page\" beyond the number of available pages' );
          } else {
            this.reload(newvalue);
          }
          break;
        case "classes":
          var pagers = this.$pagingbar;
          if (!pagers.hasClass(newvalue)) {
            pagers.addClass(newvalue);
          }
          break;
        case "searchtext":
          this.reload();
          break;
      }
    }
    
    , _makeRequest: function () {
      var self = this
        , tmp = {}
        , opts = this.options
        , req = $.extend({}, opts.ajaxoptions)
        , acc = this._getAccessor
        , mask = this._maskContent
        , u = this._unmaskContent
        , data = self.$element.data('ajaxPager');
      
      this.private.firstrecord = ((this.options.page - 1) * this.options.limit) + 1;
      var end = (this.private.firstrecord + this.options.limit) - 1;
      this.private.lastrecord = (end < this.private.totalrecords) ? end : this.private.totalrecords;
      this.private.totalpages = Math.ceil(this.private.totalrecords/this.options.limit);
      
      tmp[opts.params.start] = this.private.firstrecord;
      tmp[opts.params.page] = opts.page;
      tmp[opts.params.limit] = opts.limit;
      if (opts.sortcolumn) {
        tmp[opts.params.sort] = opts.sortcolumn;
        tmp[opts.params.dir] = opts.sortdir;
      }
      if (opts.searchtext) {
        tmp[opts.params.search] = opts.searchtext;
      }
      for(var i in req){
        if (req[i] === null) {
          delete req[i];
        }
      }
      req.data = $.extend({}, req.data, tmp);
      mask.call(self.$element, opts.loadtext);
      $.ajax($.extend(req,{
        success: function (d, s, o) {
          var output = null,
            dataset = null,
            totalpages = null,
            totalrecords = null;
          // Preprocess the return, if necessary
          d = (opts.listeners.preprocess && typeof opts.listeners.preprocess === 'function') ? opts.listeners.preprocess.call(self.$element, d) : d;
          // Adjust our internal data to reflect values returned from the server
          // Valuable to change the display if a search is conducted
          dataset = acc(d, opts.reader.root);
          //totalpages = parseInt(acc(d, opts.reader.totalpages));
          //totalpages = parseInt((totalpages !== 'undefined') ? totalpages : 1);
          totalrecords = parseInt(acc(d,opts.reader.totalrecords));
          self.private.totalrecords = parseInt((totalrecords !== undefined) ? totalrecords : dataset.length);
          //cp.call($self, page, totalpages, totalrecords);
          output = (opts.renderoutput && typeof opts.renderoutput === 'function') ? opts.renderoutput.call(self.$element, d) : d;
          self.$element.trigger('beforeload');
          u.call(self.$element, []);
          self.$element.html(output);
          
          if (opts.stripedrows) {
            self.$element.children(':even').addClass('striped-row')
          }
          self.$element.data('ajaxPager', $.extend(data, {dataloaded: true}));
          self._renderData();
          self.$element.trigger('load');
        },
        error: function (o, s, err){
          u.call(self.$element, []);
          $.error('There was an error in making your request. Please notify your developer.');
        }
      }));
    }
  
    , _buildPagerBar: function (settings) {
      var ui = '<div class="navbar' + ((settings.inverse) ? ' navbar-inverse' : ' navbar-default') + ' ajaxPager' + ((settings.classes.length > 0) ? (' ' + settings.classes) : '') + '">'
        
          + '<div class="container-fluid">'
          +'<div class="navbar-header">'
            +'<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#pagination-1">'
              +'<span class="sr-only">Toggle navigation</span>'
              +'<span class="icon-bar"></span>'
              +'<span class="icon-bar"></span>'
              +'<span class="icon-bar"></span>'
            +'</button>'
          +'</div>'
            + '<div class="collapse navbar-collapse"  id="pagination-1">'
              + '<ul class="nav navbar-nav">'
                + '<li><a href="javascript:void(0);" data-pagingaction="first" class="paging-nav startlink"><i class="glyphicon glyphicon-fast-backward"></i></a></li>'
                + '<li class="divider-vertical"></li>'
                + '<li><a href="javascript:void(0);" data-pagingaction="previous" class="paging-nav startlink"><i class="glyphicon glyphicon-backward"></i></a></li>'
                + '<li class="divider-vertical"></li>'
              + '</ul>'
              + '<span class="nav navbar-text"><strong>Page</strong></span>'
              + '<form name="jump" class="navbar-form navbar-left">'
              +'<div class="form-group">'
                + '<input type="text" name="page" value="1" class="form-control" style="width:35px;" /> '
              +'</div>'  
              + '</form>'
              +'<span class="nav navbar-text"><strong>of <span class="total-pages">0</span></strong></span>'
              + '<ul class="nav navbar-nav">'
                + '<li class="divider-vertical"></li>'
                + '<li><a href="javascript:void(0);" data-pagingaction="next" class="paging-nav endlink"><i class="glyphicon glyphicon-forward"></i></a></li>'
                + '<li class="divider-vertical"></li>'
                + '<li><a href="javascript:void(0);" data-pagingaction="last" class="paging-nav endlink"><i class="glyphicon glyphicon-fast-forward"></i></a></li>'
                + '<li class="divider-vertical"></li>';
                if (settings.limitdd) {
                  ui += '<li class="dropdown">'
                        + '<a class="dropdown-toggle" data-toggle="dropdown" href="javascript:void(0);">Limit <b class="caret"></b></a>'
                        + '<ul class="dropdown-menu limitdd">';
                        for (var i = 0; i < settings.limitoptions.length; i++) {
                          ui += '<li><a href="javascript:void(0);" class="paging-limit" data-limit="' + settings.limitoptions[i] + '"><i class="' + ((settings.limitoptions[i] === settings.limit) ? 'glyphicon glyphicon-chevron-right' : '') + '"></i> ' + settings.limitoptions[i] + '</a></li>';
                        }
                        ui += '</ul>'
                      + '</li>'
                      + '<li class="divider-vertical"></li>';
                }
    
                if (!$.isEmptyObject(settings.sortby)) {
                  ui += '<li class="dropdown">'
                    + '<a class="dropdown-toggle" data-toggle="dropdown" href="javascript:void(0);">Sort By <b class="caret"></b></a>'
                      + '<ul class="dropdown-menu sortby">';
                      for (var i in settings.sortby){
                        ui += '<li><a href="javascript:void(0);" class="paging-filter" data-sortcol="' + i + '">';
                        if (settings.sortcolumn && i === settings.sortcolumn) {
                          if (settings.sortdir === 'asc') {
                            ui += '<i class="glyphicon glyphicon-arrow-up">';
                          } else if (settings.sortcolumn && settings.sortdir === 'desc') {
                            ui += '<i class="glyphicon glyphicon-arrow-down">';
                          }
                        } else {
                          ui += '<i class="glyphicon glyphicon-">';
                        }
                        ui += '</i> ' + settings.sortby[i] + '</a></li>';
                      }
                      ui += '</ul>'
                    + '</li>'
                    + '<li class="divider-vertical"></li>';
                  }
      
                ui += '</ul>'
                + '<span class="nav pull-right navbar-text pagingbar-counts">'
                  + '<strong>Showing <span class="first-record">0</span> - <span class="last-record">0</span> of <span class="record-count">0</span></strong>'
                + '</span>'
              
            + '</div>'
          + '</div>'
        + '</div>';
      return ui;
    }
    
    , _getAccessor : function(obj, expr) {
      var ret,p,prm = [], i;
      if( typeof expr === 'function') { return expr(obj); }
      ret = obj[expr];
      if(ret===undefined) {
        try {
          if ( typeof expr === 'string' ) {
            prm = expr.split('.');
          }
          i = prm.length;
          if( i ) {
            ret = obj;
              while (ret && i--) {
              p = prm.shift();
              ret = ret[p];
            }
          }
        } catch (e) {}
      }
      return ret;
    }
    
    , _maskContent: function (label) {
      var $self = this;
      $self.append('<div class="component-backdrop fade in" />').addClass('masked');
      if(label !== undefined) {
        var maskMsgDiv = $('<div class="mask-msg alert alert-info" style="display:none;"></div>');
        maskMsgDiv.append('<div>' + label + '</div>');
        $self.append(maskMsgDiv);
        
        //calculate center position
        maskMsgDiv.css("top", Math.round($self.height() / 2 - (maskMsgDiv.height() - parseInt(maskMsgDiv.css("padding-top")) - parseInt(maskMsgDiv.css("padding-bottom"))) / 2)+"px");
        maskMsgDiv.css("left", Math.round($self.width() / 2 - (maskMsgDiv.width() - parseInt(maskMsgDiv.css("padding-left")) - parseInt(maskMsgDiv.css("padding-right"))) / 2)+"px");
        
        maskMsgDiv.show();
      }
    }
    
    , _unmaskContent: function () {
      var $self = this;
      $('div.component-backdrop,div.mask-msg', $self).remove();
      $self.removeClass('masked');
    }
  };
  
  $.fn.pager = function (option, args) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('ajaxPager')
        , options = typeof option == 'object' && option
      if (!data) $this.data('ajaxPager', (data = new ajaxPager(this, options)))
      if (typeof option == 'string') data[option](args);

    })
  }
  
//publicly accessible defaults
  $.fn.pager.defaults = {
    position: 'top', // top|bottom|both
    classes: '', // for additional classes
    inverse: false,
    stripedrows: false,
    loadtext: 'Loading...',
    page: 1,
    limit: 25, // number of records
    limitdd: true,
    limitoptions: [25,50,75,100],
    sortcolumn: null,
    sortdir: 'asc',
    sortby: {},
    searchtext: null,
    ajaxoptions: {
      url: '',
      type: 'POST',
      data: {},
      dataType: 'json'
    },
    reader: {
      success: 'success',
      message: 'message',
      totalpages: 'totalpages',
      totalrecords: 'totalrecords',
      root: ''
    },
    params: {
      start: 'start',
      limit: 'limit',
      page: 'page',
      sort: 'sort',
      dir: 'dir',
      search: 'search'
    },
    renderoutput: null,
    listeners: {
      init: null,
      render: null,
      preprocess: null,
      beforeload: null,
      load: null,
      destroy: null
    }
  };
  
  $.fn.pager.privatevars = {
    dataloaded: false,
    rendered: false,
    totalpages: 12,
    totalrecords: 293,
    firstrecord: 0,
    lastrecord: 0,
    pagers: null
  };
  
  $.fn.pager.Constructor = ajaxPager;
  
  $.fn.ajaxPager = $.fn.pager; // Backwards compatibility
  
}(window.jQuery);