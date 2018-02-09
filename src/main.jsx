var IDB = (function(){
    const APT_PRICES = 'apt_prices';
    var idb, OpenIDB = function(){
        idb = window.indexedDB;
        return idb.open('kbsise', 1, function(upgradeDb){
            const AptPricesStore = upgradeDb.createObjectStore(APT_PRICES, {
                keyPath:'name'
            });
        });
    },
    create = function(dbStore, data){
        OpenIDB().then((db)=>{
            const transaction = db.transaction(dbStore, 'readwrite');
            const store = transaction.objectStore(dbStore);

            store.put(data);

            return transaction.complete;
        })
    },
    read = function(dbStore, key){
        OpenIDB().then((db)=> {
            const transaction = db.transaction(dbStore);
            const store = transaction.objectStore(dbStore);

            if(key){
                const index = store.index(key);
                return index.getAll();
            }else{
                return store.getAll();
            }
        });
    },
    del = function(dbStore, key){
        OpenIDB().then((db) => {
            const transaction = db.transaction(dbStore, 'readwrite');
            const store = transaction.objectStore(dbStore);

            store.delete(key);

            return transaction.complete;
        });
    };

    return {
        create:create,
        update:create,
        read:read,
        del:del,
        APT_PRICES:APT_PRICES,
    }
})();

(function(){
    var init = function(){
        $('.btn-excel').click(downloadExcel);
        $('.btn-send').click(crawlingKB);
        $('#month').val(moment().format('MM'));
        $('#month').change(changeMonth);
    },
    downloadExcel = function(){
        var tab_text="<table border='2px'><tr bgcolor='#87AFC6'>";
        var textRange; var j=0;
        tab = document.getElementById('apt-price'); // id of table

        for(j = 0 ; j < tab.rows.length ; j++)
        {
            tab_text=tab_text+tab.rows[j].innerHTML+"</tr>";
            //tab_text=tab_text+"</tr>";
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

        console.log(years);
        /*if(name){
            datas = IDB.read(IDB.APT_PRICES, name);
            console.log(datas);
        }else{
            start();
        }*/
        start();

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
                currentCount++;
                getData(param);
                console.log('get data start...');
            }else{
                console.log('get data end...');

                $('.tbl_col').each(function(idx, item){
                    console.log('item : ', $(item).children('table').children('tbody'), idx);
                    $($(item).children('table').children('tbody').html()).appendTo('#total-render');
                });
                console.log('이름 : ', $($('#물건식별자').children(':selected')[0]).text());


                $('#apt-name').text($($('#부동산대지역코드').children(':selected')[0]).text() + ' '
                    + $($('#부동산중지역코드').children(':selected')[0]).text() + ' '
                    + $($('#부동산소지역코드').children(':selected')[0]).text() + ' '
                    +$($('#물건식별자').children(':selected')[0]).text());
                $('#temp-render').html('');
                $('#apt-price').css({'display':'table'});

                /*datas = parseDatas();
                IDB.create(IDB.APT_PRICES, {
                    name:$('#apt-name').text(),
                    datas:datas
                });*/
                //console.log('saved..!');
                createPriceChart();
                createValueChart();

                $('body').hideLoading();
            }
        }
        function getData(param){
            var query = '&조회시작년도='+param.startYear+'&조회시작월='+param.startMonth+'&조회종료년도='+param.endYear+'&조회종료월='+param.endMonth;
            $.ajax({
                url:$('input[name="url"]').val() + query,
            })
                .done(function(result){
                    console.log(result);
                    $(result).appendTo('#temp-render');
                    start();
                });
        }
    },
    parseDatas = function(){
        var lists = $('#total-render').children(), datas = [];

        lists.each((idx, item) => {
            let values = [];

            $(item).children().each((idx, item)=>{
                values.push(idx == 0 ? $(item).text().replace(/\,/g, '') : parseInt($(item).text().replace(/\,/g, '')));
            });
            datas.push(values);
        });

        console.log(datas);

        return datas;
    },
    createPriceChart = function(){
        var lists = $('#total-render').children();
        console.log('lists : ', lists);
        for(var datas = [[], [], []], k = 0, l = 2 ; k < l ; k++){
            for(var i = lists.length - 1, j = 0 ; i > j ; i--){
                datas[k][datas[k].length] = parseInt($(lists[i]).children(':nth-child(' + (k == 0 ? '3':'6') + ')').text().replace(/\,/g, ''));
            }
        }
        for(var i = 0, j = datas[0].length ; i < j ; i++){
            datas[2][datas[2].length] = datas[0][i] - datas[1][i];
        }
        for(var labels = [], i = lists.length - 1, j = 0 ; i > j ; i--){
            labels[labels.length] = $(lists[i]).children(':nth-child(1)').text();
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
                    callbacks: {
                        footer: function(tooltipItems, data) {

                        },
                    },
                    footerFontStyle: 'normal'
                },
            }
        });
    },
    createValueChart = function(){
        var lists = $('#total-render').children();
        console.log('lists : ', $('#month').val());


        for(var datas = [], labels = [], selectedMonth = $('#month').val(), i = lists.length - 1, j = 0 ; i > j ; i--){

            if($(lists[i]).children('th').text().split('.')[1] == selectedMonth){
                datas[datas.length] = parseInt($(lists[i]).children(':nth-child(4)').text().replace(/\,/g, ''))*10000;
                labels[labels.length] = $(lists[i]).children('th').text().split('.')[0] + '.' + selectedMonth;
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
    changeMonth = function (){
        createValueChart();
    },
    workerMonthlyAvgFee = [3112474,	3252090, 3444054, 3656201, 3900622,	3853189, 4007671, 4248619, 4492364, 4606216, 4734603, 4816665, 4884448, 5039770];

    init();
})();