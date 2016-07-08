var DBReader = DBReader || {};
var MessageHandler = require('./util/MessageHandler');

DBReader.ProcedureMapper = function (_connectionConfig) {
    this.ConnectionConfig =_connectionConfig;
    this.mysqlClient = require('mysql');
    this.Connection = null;
    this.isValid = { isValid : false, messages: []};
};

DBReader.ProcedureMapper.ConnectionConfig = {
  Host:'',
  Password:'',
  User:'',
  DB:''
};

DBReader.ProcedureMapper.prototype.ValidateConnectionParam = function () {

  var host = this.ConnectionConfig.Host,
      user = this.ConnectionConfig.User,
      pwd = this.ConnectionConfig.Password,
      db = this.ConnectionConfig.DB,
      response = [];

      if(host === null || host === undefined || host === '')
        response.pop('O valor do host não pode ser nulo, indefinido ou vazio');

      if(user === null || user === undefined || user === '')
        response.pop('O valor do user não pode ser nulo, indefinido ou vazio');

      if(pwd === null || pwd === undefined || pwd === '')
        response.pop('O valor do pwd não pode ser nulo, indefinido ou vazio');

      if(db === null || db === undefined || db === '')
        response.pop('O valor do db não pode ser nulo, indefinido ou vazio');

      return {
          isValid : response.length == 0,
          messages : response
      };

};

DBReader.ProcedureMapper.prototype.Connect = function () {

    var result = this.ValidateConnectionParam();

    if(!result.isValid){
        MessageHandler.ShowMessages(result.messages);
        return;
    }

    var ctx = this;

    this.connection = this.mysqlClient.createConnection({
        host: ctx.ConnectionConfig.Host,
        user: ctx.ConnectionConfig.User,
        password: ctx.ConnectionConfig.Password,
        database: ctx.ConnectionConfig.DB,
        multipleStatements:true //Habilita o uso de múltiplas declarações sql na string enviada ao banco!
    });

    this.connection.connect(function (err) {
        if(err){
            MessageHandler.ShowMessages(['Houve um erro ao acessar o banco de dados: ' + err.code]);
        }else{
          console.log('Conexão realizada com sucesso!');
        }
    });
};

DBReader.ProcedureMapper.prototype.Disconnect = function () {
  this.connection.end(function (err) {
    if(err){
        MessageHandler.ShowMessages(['Houve um erro ao desconectar do banco de dados: ' + err.code]);
    }else{
          MessageHandler.ShowMessages(['Conexão encerrada com sucesso!']);
    }
  });
};

DBReader.ProcedureMapper.prototype.GenerateCRUD = function GenerateCRUD (table) {
    var query = '';
};

DBReader.ProcedureMapper.prototype.GetColumns = function GetColumns (table, callback) {
    var clm = null;
    var ctx = this;
    var arr = [];

     this.connection.query('DESCRIBE ' + table, function (err, rows) {
       if (err) {
         console.log(err);
       }  else {
         for (var i = 0, count = rows.length; i < count; i++) {
           var item = rows[i];
            var obj = {
             'name': rows[i].Field
            ,'type': rows[i].Type
            ,'isNullable': rows[i].Null ? true : false
            ,'isPK': (rows[i].Key != null && rows[i].Key == 'PRI') ? true : false
           };

           arr.push(obj);
         }
       }

      callback(arr);
    });
};

DBReader.ProcedureMapper.prototype.GenerateSelect = function GenerateSelect (table) {
  var ctx = this;

    this.GetColumns(table, function cbkGenerateSelect (tableInfo) {

        var parameters = ctx.MountQueryParameters(tableInfo, 'SELECT');

        var text  = '';
            text += 'DELIMITER ## \n'
            text += 'DROP PROCEDURE IF EXISTS sp_' + table + '_SELECT ; \n'
            text += 'CREATE PROCEDURE sp_' + table + '_SELECT ' + parameters + ' \n';
            text += 'BEGIN \n';
            text += 'SELECT \n';

        for (var i = 0, count = tableInfo.length; i < count; i++) {
          text += (i==0 ? '  ':', ') + tableInfo[i].name + ' \n';
        }

        text += 'FROM ' + table + ' \n'
        text += ctx.MountWhereCondition(tableInfo) + ' \n';
        text += 'END## \n'
        text += 'DELIMITER ; \n';

        console.log(text);

        ctx.connection.query(text,function (err) {
            console.log('Houve um erro ao executar a procedure de select: ' + err);
        });

    });
};

DBReader.ProcedureMapper.prototype.MountQueryParameters = function MountQueryParameters(tableInfo, sqlCommand) {
    var key = null,
        text = '';
        i = 0,
        count = tableInfo.length;

        if (tableInfo == null || tableInfo == undefined || count <= 0) return '';

        text += '( ';

        while (key == null && i < count) {
          if(tableInfo[i].Key == true){
            key == tableInfo[i];
          }

          i++;
        }

        if(key == null){
            if(sqlCommand.toUpperCase() == 'SELECT'){
              key = tableInfo[0];
            }else {
              return '';
            }
        }

        text += 'in p_' + key.name + ' ' + key.type + ' ) \n';

        return text;
};

DBReader.ProcedureMapper.prototype.MountWhereCondition = function MountWhereCondition(tableInfo) {

};

// ######## Teste #########

var obj = new DBReader.ProcedureMapper({
  Host:'127.0.0.1',
  Password:'#gt512M4a1',
  User:'root',
  DB:'App'
});


obj.Connect();
obj.GenerateSelect('Empregado');
