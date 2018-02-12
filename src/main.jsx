

var IDB = (function(){
    const TABLE_APT_PRICES = 'apt_prices';
    var db,
    init = function(){
        if(!window.indexedDB){
            return window.alert("Your browser doesn't support a stable version of IndexedDB.")
        }

        var request = window.indexedDB.open('value-chart', 1);

        return new Promise(function(resolve, reject){
            request.onerror = function(event){
                console.log("error: ");
                reject();
            };
            request.onsuccess = function(event){
                db = request.result;
                console.log("success: " + db);
                resolve(IDB);
            };
            request.onupgradeneeded = function(event){
                db = event.target.result;
                var objectStore = db.createObjectStore(TABLE_APT_PRICES, {
                    keyPath:'url'
                });
            };
        });
    },
    create = function(table, data){
        console.log('idb add call!!');
        const request = db.transaction([table], 'readwrite')
            .objectStore(table)
            .add(data);

        request.onsuccess = function(event){
            return console.log('data added success: ', event);
        };
        request.onerror = function(event){
            return console.log('data added failure: ', event);
        };
    },
    read = function(table, key){
        const request = db.transaction([table])
            .objectStore(table)
            .get(key);
        return new Promise(function(resolve, reject){
            request.onsuccess = function(event){
                if(request.result){
                    console.log('data read success: ', event);
                    resolve(event.target.result);
                }else{
                    reject();
                }
            };
            request.onerror = function(event){
                console.log('data read failure: ', event);
                reject();
            };
        });
    },
    readAll = function(table){
        const request = db.transaction([table])
            .objectStore(table)
            .openCursor();

        return new Promise(function(resolve, reject){
            var datas = [];
            request.onsuccess = function(event){
                var cursor = event.target.result;
                if(cursor){
                    datas.push(cursor.value);
                    cursor.continue();
                }else{
                    resolve(datas);
                }
            };
            request.onerror = function(event){
                console.log('data read all failure: ', event);
                reject();
            };
        });
    },
    del = function(table, key){
        const request = db.transaction([table], 'readwrite')
            .objectStore(table)
            .delete(key);

        request.onsuccess = function(event){
            console.log('data deleted success: ', event);
        };
        request.onerror = function(event){
            console.log('data deleted failure: ', event);
        };
    };

    return {
        init:init,
        create:create,
        update:create,
        read:read,
        del:del,
        readAll:readAll,
        TABLE_APT_PRICES:TABLE_APT_PRICES,
    }
})();
var SIDEBAR = (function(){
    var LIST_CLICK = 'list_click'
        listeners = {}, init = function(){
        $('#saved-lists').on('click', 'li>a', function(e){
            /*console.log($(e.target).attr('data-idx'), 'clicked!!!!');*/
            if(typeof listeners[LIST_CLICK] == 'function'){
                listeners[LIST_CLICK]($(e.target).attr('data-idx'));
            }
        });
    },
    reload = function(){
        IDB.readAll(IDB.TABLE_APT_PRICES)
            .then(function(datas){
                console.log(datas);
                render(datas);
            }, function(){

            });
    },
    render = function(datas){
        datas.forEach((item, idx) => $(`
            <li><a data-idx="${idx}">${item.name}</a></li>    
        `).appendTo('#saved-lists'));
    },
    addEventListener = function(name, func){
        listeners[name] = func;
    };
    init();
    return {
        reload:reload,
        addEventListener:addEventListener,
        LIST_CLICK:LIST_CLICK,
    }
})();

(function(){
    var init = function(){
        $('.btn-excel').click(downloadExcel);
        $('.btn-send').click(crawlingKB);
        $('#month').val(moment().format('MM'));
        $('#month').change(changeMonth);

        IDB.init()
            .then(function(){
                SIDEBAR.addEventListener(SIDEBAR.LIST_CLICK, clickList);
                SIDEBAR.reload();
            });
    },
    clickList = function(idx){
        console.log('click~~~', idx);
        datas = IDB.readAll(IDB.TABLE_APT_PRICES)
            .then(function(datas){
                renderFromDatas(datas[idx]);
            });
    },
    downloadExcel = function(){
        var tab_text="<table border='2px'><tr bgcolor='#87AFC6'>";
        var textRange; var j=0;
        tab = document.getElementById('apt-price'); // id of table

        for(j = 0 ; j < tab.rows.length ; j++)
        {
            tab_text=tab_text+tab.rows[j].innerHTML+"</tr>";
        }

        tab_text=tab_text+"</table>";
        tab_text= tab_text.replace(/<A[^>]*>|<\/A>/g, "");//remove if u want links in your table
        tab_text= tab_text.replace(/<img[^>]*>/gi,""); // remove if u want images in your table
        tab_text= tab_text.replace(/<input[^>]*>|<\/input>/gi, ""); // reomves input params

        var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE ");

        if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))      // If Internet Explorer
        {
            txtArea1.document.open("txt/html","replace");
            txtArea1.document.write(tab_text);
            txtArea1.document.close();
            txtArea1.focus();
            sa=txtArea1.document.execCommand("SaveAs",true,"kbsise.xls");
        }
        else                 //other browser not tested on IE 11
            sa = window.open('data:application/vnd.ms-excel,' + encodeURIComponent(tab_text));

        return (sa);
    },
    crawlingKB = function(){
        $('#total-render').html('');
        $('#apt-price').css({'display':'none'});
        $('body').showLoading();
        console.log(moment());
        var markedYear = '2004',
            currentYear = moment().format('YYYY'),
            years = [], gap,
            totalCount = 0;
        while(gap = moment(currentYear).diff(moment(markedYear), 'years') > 0){
            nextYear = moment(markedYear).add(59, 'months').format('YYYYMM');
            currYear = moment().format('YYYYMM');
            years.unshift([moment(markedYear).format('YYYYMM'), moment(currYear).diff(moment(nextYear)) > 0 ? nextYear : currYear]);
            markedYear = moment(markedYear).add(60, 'months').format('YYYY');
            totalCount++;
        }
        var currentCount = 0;
        var url = $('input[name="url"]').val(), datas;
        console.log(years);
        datas = IDB.read(IDB.TABLE_APT_PRICES, url)
            .then(function(datas){
                    console.log('readed: ', datas);
                    renderFromDatas(datas);
                },
                function(){
                    start();
                });

        function start(){
            console.log('start~~');
            if(currentCount < totalCount){
                var param = years[currentCount];
                param = {
                    startYear:param[0].substr(0, 4),
                    startMonth:param[0].substr(4, 2),
                    endYear:param[1].substr(0, 4),
                    endMonth:param[1].substr(4, 2)
                };
                getData(param);
                currentCount++;
                console.log('get data start...');
            }else{
                console.log('get data end...');

                result = parseDatas();
                datas = { url:url, prices:result.prices, name:result.name };
                IDB.create(IDB.TABLE_APT_PRICES, datas);
                console.log('saved..!');
                renderFromDatas(datas);
                $('body').hideLoading();
            }
        }
        function getData(param){
            var query = '&조회시작년도='+param.startYear+'&조회시작월='+param.startMonth+'&조회종료년도='+param.endYear+'&조회종료월='+param.endMonth;
            $.ajax({
                url:url + query,
            })
                .done(function(result){
                    console.log(result);
                    $(result).appendTo('#temp-render');
                    start();
                });
        }
    },
    parseDatas = function(){
        var lists = $('.tbl_col tbody').children(), prices = [], name;

        lists.each((idx, item) => {
            let values = [];

            $(item).children().each((idx, item)=>{
                values.push(idx == 0 ? $(item).text().replace(/\,/g, '') : parseInt($(item).text().replace(/\,/g, '')));
            });
            prices.push(values);
        });

        console.log(prices);

        name = $($('#부동산대지역코드').children(':selected')[0]).text() + ' '
        + $($('#부동산중지역코드').children(':selected')[0]).text() + ' '
        + $($('#부동산소지역코드').children(':selected')[0]).text() + ' '
        +$($('#물건식별자').children(':selected')[0]).text();

        $('#temp-render').html('');

        return {
            prices:prices,
            name:name,
        };
    },
    changeMonth = function (){
        var url = $('input[name="url"]').val();
        datas = IDB.read(IDB.TABLE_APT_PRICES, url)
            .then(function(datas){
                    createValueChart(datas.prices);
                });

    },
    renderFromDatas = function(datas){
        createPriecTable(datas);
        createPriceChart(datas.prices);
        createValueChart(datas.prices);
        $('body').hideLoading();
    },
    createPriceChart = function(sources){
        for(var datas = [[], [], []], k = 0, l = 2 ; k < l ; k++){
            for(var i = sources.length - 1, j = 0 ; i > j ; i--){
                datas[k][datas[k].length] = sources[i][k == 0 ? 2:5];
            }
        }
        for(var i = 0, j = datas[0].length ; i < j ; i++){
            datas[2][datas[2].length] = datas[0][i] - datas[1][i];
        }
        for(var labels = [], i = sources.length - 1, j = 0 ; i > j ; i--){
            labels[labels.length] = sources[i][0];
        }
        new Chart($('#chart'), {
            type:'bar',
            data:{
                datasets:[{
                    label:'매-전',
                    data:datas[2],
                    backgroundColor: "rgba(107, 201, 8, 0.2)",
                    borderColor: "rgba(107, 201, 8, 1)",
                    hoverBackgroundColor: "rgba(72, 137, 2, 0.2)",
                    hoverBorderColor: "rgba(72, 137, 2, 1)",
                },{
                    label:'매매가',
                    data:datas[0],
                    type:'line',
                    /*backgroundColor: "rgba(255,99,132,0.2)",*/
                    backgroundColor:"rgba(1,1,1,0)",
                    borderColor: "rgba(255,99,132,1)",
                    hoverBackgroundColor: "rgba(255,99,132,0.4)",
                    hoverBorderColor: "rgba(255,99,132,1)",
                },{
                    label:'전세가',
                    data:datas[1],
                    type:'line',
                    /*backgroundColor: "rgba(0, 144, 255, 0.2)",*/
                    backgroundColor:"rgba(1,1,1,0)",
                    borderColor: "rgba(0, 144, 255, 1)",
                    hoverBackgroundColor: "rgba(0, 108, 191, 0.2)",
                    hoverBorderColor: "rgba(0, 108, 191, 1)",
                }],
                labels:labels
            },
            options:{
                maintainAspectRatio: false,
                title: {
                    display: true,
                    text: $('#apt-name').text() + ' 매매-전세-갭 그래프'
                },
                tooltips: {
                    mode: 'index',
                    footerFontStyle: 'normal'
                },
            }
        });
    },

    createValueChart = function(sources){
        console.log('month : ', $('#month').val());

        for(var date, datas = [], labels = [], selectedMonth = $('#month').val(), i = sources.length - 1, j = 0 ; i > j ; i--){

            date = sources[i][0].split('.');
            if(date[1] == selectedMonth){
                datas[datas.length] = sources[i][3]*10000;
                labels[labels.length] = date[0] + '.' + selectedMonth;
            }
        }

        console.log('labels :: ', labels);

        for(var values = [], i = 0, j = datas.length ; i < j ; i++){
            values[values.length] = parseFloat((datas[i]/(workerMonthlyAvgFee[i]*12)).toFixed(2));
        }


        console.log('values :: ', values);
        let sum = values.reduce((pre, curr) => curr += pre);
        let avg = parseFloat((sum / values.length).toFixed(2));
        let avgs = [];
        values.forEach(()=> avgs.push(avg));

        console.log(sum, avgs);

        new Chart($('#value-chart'), {
            type:'line',
            data:{
                datasets:[{
                    label:'pir',
                    data:values,
                    backgroundColor: "rgba(107, 201, 8, 0)",
                    borderColor: "rgba(107, 201, 8, 1)",
                    hoverBackgroundColor: "rgba(72, 137, 2, 0.2)",
                    hoverBorderColor: "rgba(72, 137, 2, 1)",
                },{
                    label:'pir평균',
                    data:avgs,
                    /*backgroundColor: "rgba(255,99,132,0.2)",*/
                    backgroundColor:"rgba(1,1,1,0)",
                    borderColor: "rgba(255,99,132,1)",
                    hoverBackgroundColor: "rgba(255,99,132,0.4)",
                    hoverBorderColor: "rgba(255,99,132,1)",
                }],
                labels:labels
            },
            options:{
                maintainAspectRatio: false,
                title: {
                    display: true,
                    text: $('#apt-name').text() + ' 가치차트'
                }
            }
        });
    },
    createPriecTable = function(datas){
        $('#apt-name').text(datas.name);
        datas.prices.forEach((item, idx)=> $(`<tr><th>${item[0]}</th>
                <td>${item[1]}</td>
                <td>${item[2]}</td>
                <td>${item[3]}</td>
                <td>${item[4]}</td>
                <td>${item[5]}</td>
                <td>${item[6]}</td>
                </tr>`).appendTo('#total-render')
        );
        $('#apt-price').css({'display':'table'});
    }
    workerMonthlyAvgFee = [3112474,	3252090, 3444054, 3656201, 3900622,	3853189, 4007671, 4248619, 4492364, 4606216, 4734603, 4816665, 4884448, 5039770];

    init();
})();
