var builder = require('botbuilder');
var restify = require('restify');

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url); 
 });
 
var connector = new builder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_PASSWORD
});
 
server.post('/api/messages', connector.listen()); 

var menuItems = {
	"Saisir votre nom" : {
		item : 'askName'
	},
	"Reserver une table" : {
		item : 'reservation'
	}
};

var bot = new builder.UniversalBot(connector, [
    function(session){
		//session.beginDialog('greetings');
		session.send('Bienvenu dans notre restaurant');
		session.beginDialog('mainMenu');
    }
]);

bot.dialog("mainMenu", [
	function(session){
		builder.Prompts.choice(session, 'Main Menu', menuItems);
	},
	function(session, results){
		if (results.response){
			//console.log(menuItems[results.response.entity].item);
			session.beginDialog(menuItems[results.response.entity].item);
		}
	}
])
.triggerAction({
	matches: /^main menu$/i,
	confirmPromp: "Ceci annule votre réservation. Etes-vous sûr ?"
});

bot.dialog('greetings',[
    function(session){
        session.beginDialog('askName');
	},
	function(session){
        session.beginDialog('reservation');
	},
	function(session, finalResult){
        session.endDialog('Bienvenu %s ! Voici le recap de votre resrvation : <br> Date de reservation : %s <br> Nombre de personnes : %i <br> Au nom de : %s <br> Son téléphone : %i', session.privateConversationData.nom, finalResult.dateRes, finalResult.nbPersonnes, finalResult.nameOf, finalResult.numTel);
	}
]);


bot.dialog('askName',[
	function(session){
		builder.Prompts.text(session, 'Bonjour ! Comment vous appelez vous ?');
	},
	function(session, results){
		session.privateConversationData.nom = results.response;
		session.send('Bienvenue %s dans notre restaurant !', results.response);
		session.endDialogWithResult(results);
	}
])
.reloadAction(
	"restartReservation", "Recommençons depuis le début.",
	{
		matches: /^recommencer$/i,
		confirmPrompt: "Ceci va annuler votre réservation. Etes-vous sûr ?"
	}
);



bot.dialog('reservation', [
	function(session){
		builder.Prompts.text(session, 'Voulez-vous reserver pour quelle date ?');
	},
	function(session, results){
		session.privateConversationData.dateRes = results.response;
		builder.Prompts.number(session, 'Pour combien de personnes ?');
	},
	function(session, results){
		session.privateConversationData.nbPersonnes = results.response;
		builder.Prompts.text(session, 'Votre réservation est au nom de qui ?');
	},
	function(session, results){
		session.privateConversationData.nameOf = results.response;
		session.beginDialog('telValid');
	},
	function(session, results){
		var finalResult  = {
			dateRes : session.privateConversationData.dateRes,
			nbPersonnes : session.privateConversationData.nbPersonnes,
			nameOf : session.privateConversationData.nameOf,	
			numTel : session.privateConversationData.numTel
		}
		session.endDialog('Bienvenu %s ! Voici le recap de votre resrvation : <br> Date de reservation : %s <br> Nombre de personnes : %i <br> Au nom de : %s <br> Téléphone de contact: %i', session.privateConversationData.nom, finalResult.dateRes, finalResult.nbPersonnes, finalResult.nameOf, finalResult.numTel);	
		session.endDialogWithResult(finalResult);
	}
])
.reloadAction(
	"restartReservation", "Recommençons depuis le début.",
	{
		matches: /^recommencer$/i,
		confirmPrompt: "Ceci va annuler votre réservation. Etes-vous sûr ?"
	}
)
.cancelAction(
	"cancelReservation", "Reservation supprimée.",
	{
		matches: /^annuler$/i,
		confirmPrompt: "Ceci va annuler votre reservation. Etes-vous sûr ?"
	}
);


bot.dialog('telValid', [
	function(session){
		builder.Prompts.text(session, 'Veuillez entrer un numéro de téléphone valide afin de vous contacter');
	},
	function(session, results){
		var matched = results.response.match(/\d+/g);
		var number = matched ? matched.join('') : '';
		if (number.length == 10 || number.length == 11) {
			var numTel = results.response;
			session.privateConversationData.numTel = numTel;
			console.log(numTel);
			console.log('toto');
			session.endDialog();
		} else {
			session.replaceDialog('telValid', { reprompt: true});
		}
	}
]);