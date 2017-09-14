var mysql = require("mysql");

var conn = mysql.createConnection({
	host:"127.0.0.1",
	user:"root",
	password:"",
	database:"App"
});


var cleanDB = function (conexao) {
		var query = "DELETE FROM Empregado";

		conexao.query(query, function (err) {
			if(err){
				console.log("Houve um erro ao criar a tabela! - ", err);
			}else{
				console.log("Tabela criada com sucesso!");
			}
		});
};

var startupDB = function (conexao) {

	console.log('Criando a tabela de Empregados!');

	conexao.query('CREATE TABLE if not exists Empregado (Id int not null auto_increment, Nome varchar(50), primary key (Id));', function (err) {
			if(err){
				console.log('Não foi possível cadastrar a tabela de Empregados - ', err);
			}else{
				console.log('tabela de empregados cadastrada com sucesso!');
			}
	});


	console.log('Exibindo a lista de tabelas da base de dados! ');


	var info_tbl = null;

	conexao.query('SHOW TABLES;', function (err, rows) {
			if (err) {
				console.log('houve um erro ao buscar as informações das tabelas', err);
			}else{
				for (var i = 0; i < rows.length; i++) {
					console.log(rows[i].Tables_in_App);
				}
			}
	});


	/*
	conexao.query('DESCRIBE Empregado', function (err, rows) {
			if (err) {
				console.log(err);
			}else{
				console.log(rows);
			}
	});

	conexao.query('DESCRIBE Pessoa', function (err, rows) {
			if (err) {
				console.log(err);
			}else{
				console.log(rows);
			}
	});
	*/
	var arr =[];
	conexao.query('DESCRIBE Endereco', function (err, rows) {
			if (err) {
				console.log(err);
			}else{
				arr = rows
				console.log(rows);
			}
	});
};


conn.connect(function(erro){
	if(erro){
		console.log('deu ruim em alguma coisa', erro);
	}else{		
		//cleanDB(conn);
		startupDB(conn);
	}
});

/*
conn.end(function(erro){
/*	if(erro)
		console.log('erro ao finalizar');
	else
		console.log('conexao com o banco encerrada!');
}); */
