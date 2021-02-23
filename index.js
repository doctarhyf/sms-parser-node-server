const express = require('express');
const app = express();
const port = 8080;


app.use(express.json());


/*
app.get('/tshirt', (req, res) => {
    res.status(200).send({
        tshirt:'cool',
        size:'large'
    })
});
*/


app.post('/parseSMS/', (req, res) => {
    const { sms } = req.body;

    const parser = new SMSParser('voda','en');
    const parsedData = parser.getParsedData(sms, SMSParser.DATA_TYPE.JSON);

    

    console.error(sms);

    if(!sms){
        res.status(418).send({error:true, errorMessage: 'You need to provide an sms!⚠️☢️'});
    }else{
        res.status(200)
        .send(
            parsedData
        )
    }
});

/*
app.post('/tshirt/:id', (req, res) => {
    const { id } = req.params;
    const { logo, sms } = req.body;

    console.log('req.parms -> ' + JSON.stringify(req.params));
    console.log('req.body -> ' + JSON.stringify(req.body));

    if(!logo) {
        res.status(418).send('We need a logo!');
    }else{
        res.status(200).send({
            tshirt:`👕 with your ${logo} and ID of ${id}`,
            sms:`${sms}`
        })
    }
});
*/

app.listen(
    port,
    () => {
        console.log(`It's live on http://localhost:${port}`);
    }
);


// SMS PARSING -----

const RX_ADMIN_MONEY_SENT = /Trans. ID: (\w|\d){8}.\d{4}.(\w|\d){6} vous avez envoye de \d*.\d{4} \w{3} a  \d{9}.Votre solde disponible est de \d*.\d{4}\w{3}.Cout:\d*.\d{4}\w{3}/;
const RX_ADMIN_MONEY_RECEIVED = /Trans. ID: (\w|\d){8}.\d{4}.(\w|\d){6}. Vous avez recu \d*.\d{4} \w{3}. Venant de \d{9} (\w|\s)*. Votre solde disponible est de:  \d*.\d{4} \w{3}./;
const RX_ADMIN_MONEY_CHECK = /Txn. ID : (\w|\d){8}.\d{4}.(\w|\d){6}. Vous avez actuellement  \d*.\d{4}  \w{3} disponible sur votre compte courant. Et \d*.\d{4} \w{3} sur votre compte commissions ./;

const RX_USER_MONEY_SENT = /\d*\|Trans ID: (\w|\d){8}.\d{4}.(\w|\d){6}. Dear Customer. You have sent \w{3} \d*.\d{4} to \d{9} (\w|\s)*. Your available balance is \w{3} \d*.\d{4}./;
const RX_USER_MONEY_RECEIVED = /Transaction ID: (\w|\d){8}.\d{4}.(\w|\d){6}:Vous avez recu \d*.\d{4} \w{3} a partir de (\w|\d){10}, (\w|\s)*. votre nouveau solde est \d*.\d{4} \w{3}.Cout:\d*.\d{4}\w{3}/;
const RX_USER_MONEY_CHECK = /Votre solde disponible est de \d*.\d{4} \w{3}./;



class SMSParser {

    constructor (network, lang){
        this.network = network;
        this.lang = lang;
        this.TRANS_ID = 'transID';
        this.AMOUNT = 'amount';
        this.CURRENCY = 'currency';
        this.DISPONIBLE = 'disponible';
        
    }

    //sms types
    static SMS_TYPE = {
        ADMIN_MONEY_SENT : 'ADMIN_MONEY_SENT',
        ADMIN_MONEY_RECEIVED : 'ADMIN_MONEY_RECEIVED',
        ADMIN_MONEY_CHECK : 'ADMIN_MONEY_CHECK',
        USER_MONEY_SENT : 'USER_MONEY_SENT',
        USER_MONEY_RECEIVED : 'USER_MONEY_RECEIVED',
        USER_MONEY_CHECK : 'USER_MONEY_CHECK',
        NO_TYPE : 'NO_TYPE'

    };

    getSMSType(sms){

        
        
        const isAdminMoneySent = (JSON.stringify(this.parseSMSAdminMoneySent(sms)) === 'null') === false;
        const isAdminMoneyReceived = (JSON.stringify(this.parseSMSAdminMoneyReceived(sms)) === 'null') === false;
        const isAdminMoneyCheck = (JSON.stringify(this.parseSMSAdminMoneyCheck(sms)) === 'null') === false;

        const isUserMoneySent = (JSON.stringify(this.parseSMSUserMoneySent(sms)) === 'null') === false;
        const isUserMoneyReceived = (JSON.stringify(this.parseSMSUserMoneyReceived(sms)) === 'null') === false;
        const isUserMoneyCheck = (JSON.stringify(this.parseSMSUserMoneyCheck(sms)) === 'null') === false;


        

       if(isAdminMoneySent === true){
           return SMSParser.SMS_TYPE.ADMIN_MONEY_SENT;
       }

       if(isAdminMoneyReceived === true){
           return SMSParser.SMS_TYPE.ADMIN_MONEY_RECEIVED;
       }

       if(isAdminMoneyCheck === true){
        return SMSParser.SMS_TYPE.ADMIN_MONEY_CHECK;
        }

        if(isUserMoneySent === true){
            return SMSParser.SMS_TYPE.USER_MONEY_SENT;
        }

        if(isUserMoneyReceived === true){
            return SMSParser.SMS_TYPE.USER_MONEY_RECEIVED;
        }

        if(isUserMoneyCheck === true){
            return SMSParser.SMS_TYPE.USER_MONEY_CHECK;
        }

       return SMSParser.SMS_TYPE.NO_TYPE;
    }

    
    chechCurrentMatch(found){
        //check current regex macth -------------
        console.log("current regex match -> " + found);

        if(found ===  null){
            console.error('Cant parse sms, check sms format');
            return null;
        }
        // --------------------
    }
    

    parseSMSAdminMoneySent(sms){
        
        
        const test =  RX_ADMIN_MONEY_SENT.test(sms);

        if(test === false) {
            console.error('This sms is not of type of RX_ADMIN_MONEY_SENT ' );
            return null;
        }

        //console.log('RX_ADMIN_MONEY_SENT  -> ' + test);

        //Transaction ID
        var regEx = /ID: \w*\d*\.\d{4}\.\w*\d*/i;
        var found = sms.match(regEx);

        const transID = found[0].replace('ID: ', '');

        //Amount and currency
        regEx = /vous avez envoye de \d*\.\d* \w{3}/i;
        found = sms.match(regEx);

        const amountAndCurrencyData = found[0].replace('vous avez envoye de ', '').split(' ');
        const amount = amountAndCurrencyData[0];
        const currency = amountAndCurrencyData[1];

        

        //Disponible
        regEx = /disponible est de \d*\.\d*/i;
        found = sms.match(regEx);
        const disponible = found[0].replace('disponible est de ','');
        
        //parsed data object
        const data = {
            transID: transID, 
            amount: amount, 
            currency: currency,
            disponible: disponible,
            type: SMSParser.SMS_TYPE.ADMIN_MONEY_SENT
        };

        //console.log(JSON.stringify(data));
        
        return(data);
    }

    parseSMSAdminMoneyReceived(sms){


        const test =  RX_ADMIN_MONEY_RECEIVED.test(sms);

        if(test === false) {
            console.error('This sms is not of type of RX_ADMIN_MONEY_RECEIVED ' );
            return null;
        }

        //parsing
        //Transaction ID
        var regEx = /ID: \w*\d*\.\d{4}\.\w*\d*/i;
        var found = sms.match(regEx);
        const transID = found[0].replace('ID: ', '');

        //Amount and currency
        regEx = /Vous avez recu \d*.\d{4} \w{3}/i;
        found = sms.match(regEx);
        const amountAndCurrencyData = found[0].replace('Vous avez recu ', '').split(' ');
        const amount = amountAndCurrencyData[0];
        const currency = amountAndCurrencyData[1];

        //sender name and number
        regEx = /Venant de \d{9} BOB DITEND./i;
        found = sms.match(regEx);
        const senderNum = found[0].replace('Venant de ','').split(' ')[0];
        const senderName = found[0].replace('Venant de ' + senderNum, '').replace('.','');

        //solde disponible
        regEx = /Votre solde disponible est de:  \d*.\d{4} \w{3}/i;
        found = sms.match(regEx);
        const solde = found[0].replace('Votre solde disponible est de:  ', '').split(' ')[0];
        
        


        console.log('sender name num match -> ' + found);

        const data = {
            transID:transID,
            amount:amount,
            currency:currency,
            senderName:senderName,
            senderNum:senderNum,
            solde:solde,
            type: SMSParser.SMS_TYPE.ADMIN_MONEY_RECEIVED
        };

        return (data);
    }

    parseSMSAdminMoneyCheck(sms){

        const test =  RX_ADMIN_MONEY_CHECK.test(sms);

        if(test === false) {
            console.error('This sms is not of type of RX_ADMIN_MONEY_CHECK ' );
            return null;
        }

        //parsing
        //Transaction ID
        var regEx = /\w*\d*\.\d{4}\.\w*\d*/i;
        var found = sms.match(regEx);
        const transID = found[0];

        //amount and currency
        regEx = /Vous avez actuellement  \d*.\d{4}  \w{3}/i;
        found = sms.match(regEx);

        const amountCompteCourant = found[0].replace('Vous avez actuellement  ', '').split('  ')[0];
        const currency = found[0].replace('Vous avez actuellement  ', '').split('  ')[1];

        //Et 0.0170 USD sur votre compte commissions .
        regEx = /Et \d*.\d{4} \w{3} sur votre compte commissions ./i;
        found = sms.match(regEx);

        const amountCompteCommision = found[0].replace('Et ', '').replace(' sur votre compte commissions .','').split(' ')[0];


        const data = {
            transID:transID,
            amountCompteCourant:amountCompteCourant,
            amountCompteCommision:amountCompteCommision,
            currency:currency,
            type: SMSParser.SMS_TYPE.ADMIN_MONEY_CHECK
        }

        return (data);
    }

    parseSMSUserMoneySent(sms){


        const test =  RX_USER_MONEY_SENT.test(sms);

        if(test === false) {
            console.error('This sms is not of type of RX_USER_MONEY_SENT ' );
            return null;
        }

        //console.log('RX_ADMIN_MONEY_SENT  -> ' + test);

        //Transaction ID
        var regEx = /\w*\d*\.\d{4}\.\w*\d*/i;
        var found = sms.match(regEx);

        const transID = found[0];


        
        
        //Amount and currency
        regEx = /You have sent \w{3} \d*.\d{4}/i;
        found = sms.match(regEx);

        const amountAndCurrencyData = found[0].replace('You have sent ', '').split(' ');
        const amount = amountAndCurrencyData[1];
        const currency = amountAndCurrencyData[0];

        
        
        //receiver name and phone
        regEx = /to 975886099 ALBERT OMBA SHENYEMA./i;
        found = sms.match(regEx);

        console.log('cur found ' + found[0]);

        const receiverPhone = found[0].replace('to ','').split(' ')[0];
        const receiverName = found[0].replace(receiverPhone, '').replace('to ','').replace('.','').trim();

        
        

        //balance
        regEx = /Your available balance is \w{3} \d*.\d{4}./i;
        found = sms.match(regEx);
        const balance = found[0].replace('Your available balance is ', '').replace(currency, '');
        
        //parsed data object

        const data = {
            transID: transID   ,
            amount: amount, 
            currency: currency,
            receiverPhone: receiverPhone,
            receiverName: receiverName,
            balance: balance,
            type: SMSParser.SMS_TYPE.USER_MONEY_SENT
        };

        //console.log(JSON.stringify(data));*/
        
        return(data);
    }

    parseSMSUserMoneyReceived(sms){

        const test =  RX_USER_MONEY_RECEIVED.test(sms);

        if(test === false) {
            console.error('This sms is not of type of RX_USER_MONEY_RECEIVED ' );
            return null;
        }

        //parsing
        //Transaction ID
        var regEx = /\w*\d*\.\d{4}\.\w*\d*/i;
        var found = sms.match(regEx);
        const transID = found[0];

        //Amount and currency
        regEx = /Vous avez recu \d*.\d{4} \w{3}/i;
        found = sms.match(regEx);
        const amountAndCurrencyData = found[0].replace('Vous avez recu ', '').split(' ');
        const amount = amountAndCurrencyData[0];
        const currency = amountAndCurrencyData[1];

        //sender name and number
        regEx = /a partir de (\w|\d){10}, (\w|\s)*./i;
        found = sms.match(regEx);
        const senderNum = found[0].replace('a partir de ','').split(',')[0];
        const senderName = found[0].replace('a partir de ','').split(',')[1];

        //solde disponible
        regEx = /votre nouveau solde est \d*.\d{4} \w{3}./i;
        found = sms.match(regEx);
        const solde = found[0].replace('votre nouveau solde est ', '').split(' ')[0];
        
        


        console.log('sender name num match -> ' + found);

        const data = {
            transID:transID,
            amount:amount,
            currency:currency,
            senderName:senderName,
            senderNum:senderNum,
            solde:solde,
            type: SMSParser.SMS_TYPE.USER_MONEY_RECEIVED
        };

        return (data);
    }

    parseSMSUserMoneyCheck(sms){

        const test =  RX_USER_MONEY_CHECK.test(sms);

        if(test === false) {
            console.error('This sms is not of type of RX_USER_MONEY_CHECK ' );
            return null;
        }

        //console.log('RX_ADMIN_MONEY_SENT  -> ' + test);

        //Transaction ID
        var regEx = /Votre solde disponible est de \d*.\d{4} \w{3}./i;
        var found = sms.match(regEx);

        const solde = found[0].replace('Votre solde disponible est de ','').split(' ')[0];
        const currency = found[0].replace('Votre solde disponible est de ','').split(' ')[1];

        const data = {
            solde:solde,
            currency:currency,
            type: SMSParser.SMS_TYPE.USER_MONEY_CHECK
        }

        return data;
    }

    getParsedData(sms, dataType){


        var data = null;

        const smsType = this.getSMSType(sms);
        console.log('current sms type found -> ' + smsType);

    
        if(smsType === SMSParser.SMS_TYPE.ADMIN_MONEY_SENT){
            data = this.parseSMSAdminMoneySent(sms);
        }

        if(smsType === SMSParser.SMS_TYPE.ADMIN_MONEY_RECEIVED){
            data = this.parseSMSAdminMoneyReceived(sms);
        }

        if(smsType === SMSParser.SMS_TYPE.ADMIN_MONEY_CHECK){
            data = this.parseSMSAdminMoneyCheck(sms);
        }

        if(smsType === SMSParser.SMS_TYPE.USER_MONEY_RECEIVED){
            data = this.parseSMSUserMoneyReceived(sms);
        }

        if(smsType === SMSParser.SMS_TYPE.USER_MONEY_SENT){
            data = this.parseSMSUserMoneySent(sms);
        }

        if(smsType === SMSParser.SMS_TYPE.USER_MONEY_CHECK){
            data = this.parseSMSUserMoneyCheck(sms);
        }

        if(data === null){
            
            return 'sms cant be parsed';
        }
        
        

        let html = '';

        for(const key in data){
            html += '<div>' + key + ': ' + data[key] + '</div>';
        }
        
        if(dataType === SMSParser.DATA_TYPE.JSON){
            
            return data;
        }

        

        return html;
    }

    static DATA_TYPE = {
        JSON: 'JSON',
        HTML:'HTML'
    }

    smsSamples () {
        return(
            {
                userMoneySend : 'userMoneySend'
            }
        )
    }

}

// END SMS PARSING ----