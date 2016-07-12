var DBReader = DBReader || {},
    MessageHandler = require("./util/MessageHandler");

DBReader.ProcedureMapper = function (_connectionConfig) {
    this.ConnectionConfig =_connectionConfig;
    this.mysqlClient = require("mysql");
    this.Connection = null;
    this.isValid = { isValid : false, messages: []};
};

DBReader.ProcedureMapper.ConnectionConfig = {
  Host:"",
  Password:"",
  User:"",
  DB:""
};

DBReader.ProcedureMapper.prototype.ValidateConnectionParam = function () {

  var host = this.ConnectionConfig.Host,
      user = this.ConnectionConfig.User,
      pwd = this.ConnectionConfig.Password,
      db = this.ConnectionConfig.DB,
      response = [];

      if(host === null || host === undefined || host === "")
        response.pop("O valor do host não pode ser nulo, indefinido ou vazio");

      if(user === null || user === undefined || user === "")
        response.pop("O valor do user não pode ser nulo, indefinido ou vazio");

      if(pwd === null || pwd === undefined || pwd === "")
        response.pop("O valor do pwd não pode ser nulo, indefinido ou vazio");

      if(db === null || db === undefined || db === "")
        response.pop("O valor do db não pode ser nulo, indefinido ou vazio");

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
            MessageHandler.ShowMessages(["Houve um erro ao acessar o banco de dados: " + err.code]);
        }else{
          console.log("Conexão realizada com sucesso!");
        }
    });
};

DBReader.ProcedureMapper.prototype.Disconnect = function () {
  this.connection.end(function (err) {
    if(err){
        MessageHandler.ShowMessages(["Houve um erro ao desconectar do banco de dados: " + err.code]);
    }else{
          MessageHandler.ShowMessages(["Conexão encerrada com sucesso!"]);
    }
  });
};

DBReader.ProcedureMapper.prototype.GenerateCRUD = function GenerateCRUD (table) {
    var query = "";
};

DBReader.ProcedureMapper.prototype.GetColumns = function GetColumns (table, callback) {
    var clm = null,
        ctx = this,
        arr = [];

     this.connection.query("DESCRIBE " + table, function (err, rows) {
       
       if (err) {
         console.log(err);
       }  else {
         for (var i = 0, count = rows.length; i < count; i++) {
           var item = rows[i];
            var obj = {
             "name": rows[i].Field
            ,"type": rows[i].Type
            ,"isNullable": rows[i].Null ? true : false
            ,"isPK": (rows[i].Key != null && rows[i].Key == "PRI") ? true : false
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
      
            var clauses = ctx.MountWhereClause(tableInfo, "SELECT") + " \n";

            if(clauses == "")
              throw "A consulta específica exige um parâmetro para compor a clausula where";
        
            var text = ctx.MountProcedureHeader(table, sqlCommand);

            text += "BEGIN \n";
            
            text += "SELECT \n";

            for (var i = 0, count = tableInfo.length; i < count; i++) {
              text += (i==0 ? "  ":", ") + tableInfo[i].name + " \n";
            }

            text += "FROM " + table + " \n"
            text +=  clauses;
            text += "END \n";

            
            ctx.connection.query(text,function (err) {
                if(err !== null && err !== undefined)
                  console.log("Houve um erro ao gerar a procedure!" + err);
                else{
                  console.log("Procedure gerada com sucesso!");
                }
            });           

    });
};

DBReader.ProcedureMapper.prototype.MountProcedureHeader = function MountProcedureHeader(table, sqlCommand) {
  // body...
    var parameters = ctx.MountQueryParameters(tableInfo, sqlCommand),
        text  = "USE " +  this.ConnectionConfig.DB + " ;\n";            
              text += "DROP PROCEDURE IF EXISTS sp" + table + sqlCommand + " ; \n";
              text += "CREATE PROCEDURE sp" + table + sqlCommand + " " + parameters + " \n";

    return text;
};

DBReader.ProcedureMapper.prototype.GenerateInsert = function(table) {
   var ctx = this;

    this.GetColumns(table, function cbkGenerateInsert (tableInfo) {
        
        var text = ctx.MountProcedureHeader(table, 'INSERT');

            text += "BEGIN \n";
            text += " INSERT INTO " + table + " (";
        
            for (var i = 0, count = tableInfo.length; i < count; i++) {

              if(tableInfo[i].isPK == true)
                continue;

              text += (i==0 ? "  ":", ") + tableInfo[i].name + " ";
            }
        
            text += " ) \n";
        
            text += " VALUES ( ";
        
            for (var i = 0, count = tableInfo.length; i < count; i++) {
              
              if(tableInfo[i].isPK == false)
                text += (i==0 ? "  ":", ") + "p" + tableInfo[i].name + " ";
            }
        
            text += " ) \n";

            text += "END \n";

            ctx.connection.query(text,function (err) {
                if(err !== null && err !== undefined)
                  console.log("Houve um erro ao gerar a procedure!" + err);
                else{
                  console.log("Procedure gerada com sucesso!");
                }
            });
    });
};

DBReader.ProcedureMapper.prototype.GenerateUpdate = function GenerateUpdate(table) {
  // body...
    var ctx = this;

    this.GetColumns(table, function cbkGenerateInsert (tableInfo) {
        
        var text = ctx.MountProcedureHeader(table, 'UPDATE'),
            clauses = ctx.MountWhereClause(tableInfo, 'UPDATE');

            text += "BEGIN \n";
            text += " UPDATE " + table + " SET ";
        
            for (var i = 0, count = tableInfo.length; i < count; i++) {

              if(tableInfo[i].isPK == false){
                  text += (i==0 ? "  ":", ") + tableInfo[i].name + " = p" + tableInfo[i].name + "  \n";  
              }              
            }
        
            text += clauses;
        
            text += "  \n";

            text += "END \n";

            ctx.connection.query(text,function (err) {
                if(err !== null && err !== undefined)
                  console.log("Houve um erro ao gerar a procedure!" + err);
                else{
                  console.log("Procedure gerada com sucesso!");
                }
            });
    }
};

DBReader.ProcedureMapper.prototype.MountQueryParameters = function MountQueryParameters(tableInfo, sqlCommand) {
    var key = null,
        text = "";
        i = 0,
        count = tableInfo.length;

        if (tableInfo == null || tableInfo == undefined || count <= 0) return "";

        text += "( ";

        switch(sqlCommand.toUpperCase()){
            case "SELECT":
              while (key == null && i < count) {
                  if(tableInfo[i].Key == true){
                    key == tableInfo[i];
                  }

                  i++;
                }

                if(key == null){
                    if(sqlCommand.toUpperCase() == "SELECT"){
                      key = tableInfo[0];
                    }else {
                      return "";
                    }
                }

                text += "in p" + key.name + " " + this.FormatDataTypeParameter(key.type) + "  \n";
                
              break;
            case "INSERT":
              while (i < count) {
                  if(tableInfo[i].Key == false){
                      text += (i==0?" ":" , ") + "in p" + key.name + " " + this.FormatDataTypeParameter(key.type) + ";
                  }

                  i++;
              }
              break;
                  }
            case "UPDATE":
              while (i < count) {
                  text += (i==0?" ":" , ") + "in p" + key.name + " " + this.FormatDataTypeParameter(key.type) + ";
                  i++;
              }
              break;
            case "DELETE":
                while (key == null && i < count) {
                  if(tableInfo[i].Key == true){
                    key == tableInfo[i];
                  }

                  i++;
                }

                if(key == null){
                    var error = new Error("Não há nenhuma chave primária nesta tabela, a procedure de DELETE não pode ser criada.");
                    throw error;
                }

                text += "in p" + key.name + " " + this.FormatDataTypeParameter(key.type) + "  \n";

              break;
            default:
              return '';
              break;
        }

        text += " ) ";

        return text;
};

DBReader.ProcedureMapper.prototype.MountWhereClause = function MountWhereClause(tableInfo, sqlCommand) {
        if(sqlCommand == null || sqlCommand == undefined || sqlCommand == "")
          throw "Defina uma cláusula para criação da procedure desejada";

        if (tableInfo === null || tableInfo === undefined) {
          if(sqlCommand.toUpperCase() == "SELECT")
            return "WHERE 1=1 ; \n";
          else{
            throw "Não foi encontrado nenhum campo na tabela informada.";
          }
        }

        var key = null,
            text = "";
            i = 0,
            count = tableInfo.length;

        if (tableInfo == null || tableInfo == undefined || count <= 0) return "";

        while (key == null && i < count) {
          if(tableInfo[i].Key == true){
            key == tableInfo[i];
          }

          i++;
        }

        if(key == null){
            if(sqlCommand.toUpperCase() == "SELECT"){
              key = tableInfo[0];
            }else {
              return "";
            }
        }

        return "WHERE " + key.name + " = p" + key.name + " ; \n";
};

DBReader.ProcedureMapper.prototype.FormatDataTypeParameter = function FormatDataTypeParameter (type) {
  // body...
      if(type.indexOf("varchar") > 0){
          return type;
      }        
      else{
        return type.split("(")[0]; 
      }
};



// ######## Teste #########

var obj = new DBReader.ProcedureMapper({
  Host:"127.0.0.1",
  Password:"#gt512M4a1",
  User:"root",
  DB:"App"
});

obj.Connect();
obj.GenerateInsert("Pessoa");