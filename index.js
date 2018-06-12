$(function() {
    //##### app object literal, represents app status
    const app = {
        rawList: '',
        currentList: [],
        status: 0,
        settings: {
            headingType: 'p',
            listStyle: 'check-circle-o'
        }
    };

    //##### ListItem Prototype
    function ListItem(id, content, type) {
        this.id = id;
        this.content = content;
        this.startsList = false;
        this.endsList = false;

        if (type) {
            this.type = type;
        } else
            this.type = 'li';
    }

    ListItem.prototype.changeType = function() {
        if (this.type === 'li') {
            if (!app.currentList[this.id + 1]) {
                return false
            }
            this.type = 'h';
            return true;
        }
        if (this.type === 'h') {
            this.type = 'li';
            return true;
        }
    }


    //##### creating list from raw text

    // create array of ListItems from string
    function arrayFromRawList(str) {
        let rawItems = str.split('\n')
          .filter(content =>  content.match(/\w/g) === null ? false : true);
        const listArr = [];
      
        rawItems.forEach(function(content, i) {
            const listItem = new ListItem(i, content);
            listArr.push(listItem);
        });
        return listArr;
    }

    // render List

    function renderListRows(list) {
        list.forEach(function(listItem, i) {
            const currentRow = createListRow(listItem);
            currentRow.appendTo('#main-container');
            return;
        });
    }


    // ### Create jQuery Elements ### //

    function createListRow(listItem) {
        const row = $('<div class="row item-container">');
        row.data('id', listItem.id);
        const infoContainer = $('<div class="col-xs-1">');
        const typeContainer = $('<div class="item-type">');
        const type = $('<p class="item-type-symbol">');
        type.text(listItem.type);
        const contentContainer = $('<div class="col-xs-11 item-content">');
        const content = $('<p>');
        content.text(listItem.content);

        row.append(infoContainer);
        infoContainer.append(typeContainer);
        typeContainer.append(type);
        infoContainer.append(typeContainer);

        row.append(contentContainer);
        contentContainer.append(content);
        return row;
    }


    function updateListItem(id) {
        if (app.currentList[id] !== undefined) {
            const item = app.currentList[id];
            const container = $('.item-container').eq(id);
            container.find('.item-type').find('p').text(item.type);
            if (item.type === 'h') {
                container.animate({
                    left: '-35px'
                }, 150);
            }
            if (item.type === 'li') {
                $('.item-container').eq(id).animate({
                    left: '0px'
                }, 150);
            }
            container.find('.item-type').toggleClass('item-type__h');
        }
    }


    // 

    // ### LIBRARY ### //


    // analysis of list

    function findListBorders(list) {

        for (let i = 0; i < list.length - 1 ; i++) {

            if (list[i].type === 'li') {
                if (i === 0) {
                    list[i].startsList = true;
                }
                if (list[i+1].type === 'h') {
                    list[i].endsList = true;
                }
            }
            if (list[i].type === 'h') {
                list[i].startsList = false;
                list[i].endsList = false;
                list[i+1].startsList = true;
            }
        }
        list[list.length-1].endsList = true;
        return list;
    }


    // remove white space and bullets

    function removeBullets(str) {
        str = str.replace(/^\s*/, '');
        const strEnc = encodeURIComponent(str);
        if (strEnc.substr(0, 12) === '%E2%80%A2%20') {
            str = strEnc.substr(12);
            str = decodeURIComponent(str);
        }
        if (strEnc.substr(0,1) === '-') {
            str = str.substr(1);
        }

        return str
    }


    // create HTML string

    function createHtmlStr(list) {
        let str = '';
        list.forEach(function(item, i) {
            if (item.content) {
                const cleanContent = removeBullets(item.content);
                if (item.type === 'h') {
                    const headingType = app.settings.headingType;
                    str+= '<' + headingType + '><b>' + cleanContent + '</b></' + headingType + '>\n';
                    return;
                }
                const listStyle = app.settings.listStyle;
                if (item.startsList) {
                    str += '<ul class="fa fa-ul">\n';
                }
                str += '<li><i class="fa-li fa fa-' + listStyle + '"></i>' + cleanContent +'</li>\n';
                if (item.endsList) {
                    str += '</ul>\n';
                }
            }
        });
        return str
    }
  
    function getLanguage() {
      return  fetch(`https://api.havenondemand.com/1/api/async/identifylanguage/v1?text=${app.rawList}`);
    }
  
  

    // Listeners

    $('#main-container').on('click', '.item-type-symbol', function() {
        const id = $(this).closest('.item-container').data('id');
        if (app.currentList[id].changeType()) {
            updateListItem(id);
        }
    });
  
  const listTextarea = document.querySelector('#raw-terms');
  listTextarea.addEventListener('keydown', (ev) => app.rawList = (ev.target.value));
  listTextarea.addEventListener('keyup', (ev) => app.rawList = (ev.target.value));
  
  

    const clipboard = new Clipboard('#cta');

    $('#cta').on('click', function() {
        if (app.status === 0) {
            const raw = app.rawList;
            let list = arrayFromRawList(raw);
            if (!list.length) {
                return
            }
            list = findListBorders(list);
            $('#textarea-container').hide();
            app.currentList = list;
            renderListRows(app.currentList); 
            $('#instruction-text').text('Edit the list content');
            $('#cta').text('Copy HTML');
            
            getLanguage()
              .then(res => res.json())
              .then(data => console.log(data))
            app.status++;
            return;
        }
        if (app.status === 1) {
            app.currentList = findListBorders(app.currentList);
            const htmlStr = app.htmlStr = createHtmlStr(app.currentList);
            $('#main-container').append('<div id="list-container"></div>');
            $('.item-container').remove();
            $('#list-container').html(htmlStr);
            $('#result-container').text(htmlStr);
            $('#instruction-text').text('HTML copied\nto Clipboard');
            $('.instruction-display').addClass('highlight');
            $('#cta').text('Again?');
            $('#cta').addClass('new');
            $('#cta').attr('data-clipboard-text', htmlStr);
            app.status++;
            return;
        }
        
        if (app.status === 2) {            
            $('#instruction-text').text('Copy your list content in the field below');
            $('.instruction-display').removeClass('highlight');
            $('#cta').text('Next');
            $('#cta').removeClass('new');
            $('#list-container').remove();
            $('#raw-terms').val('');
            $('#textarea-container').show();
            app.status = 0;
            return;
        }
        
    });

    $('#settings-icon-container').on('click', function(){
        $('#settings-container').toggleClass('active');
    });

    $('#btn-settings-apply').on('click', function(ev) {
        ev.preventDefault();
        app.settings.headingType = $('#heading-type-select').val();
        app.settings.listStyle = $('#list-style-select').val()
        $('#settings-container').toggleClass('active');
        $(this).removeClass('warning');
        console.log(app.settings);

    });

    $('#settings-container').on('change', 'select', function(ev) {
        $('#btn-settings-apply').addClass('warning');
    });


});