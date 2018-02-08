/**
 * Created by ruudnike on 2017-04-05.
 */


function getData(){
    return {

    }
}
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


chrome.extension.sendMessage({
    action:"getSource",
    source:getData()
});