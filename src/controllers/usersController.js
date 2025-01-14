const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const bcrypt = require("bcryptjs");
//Ubicar archivo Json
const filePath = path.resolve(__dirname, '../data/users.json');

//Lectura de Json y Parseo
const usersArray = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

const generateID = () => {
    if (usersArray.length != 0) {
        const lastProduct = usersArray[Number(usersArray.length) - Number(1)];
        const lastID = Number(lastProduct.id) + Number(1);
        return lastID;
    } else {
        const lastID = 1
        return lastID;
    }
};


const controller = {
    userLogin: (req, res) => {
        return res.render("../views/users/login")
    },

    logUser:  (req, res) => {
        const resultValidation = validationResult(req);
        if (resultValidation.errors.length > 0) {
            return res.render("../views/users/login", {
                errors: resultValidation.mapped(),
                oldData: req.body,
            })
        }


        let  userToLogin = usersArray.find(oneUser => oneUser.email === req.body.email);
        if (userToLogin) {
            let okPassword =  bcrypt.compareSync(req.body.contrasenia, userToLogin.pass);

            if (okPassword) {
                delete userToLogin.pass;
              
                req.session.userLogged = userToLogin;
                if(req.body.recordarUsuario){
                    
                    res.cookie("userEmail",userToLogin.email,{
                        maxAge: (1000*60)*5
                    })
                }

                return res.redirect('./profile');

            }

            return res.render("../views/users/login", {
                errors: {
                    email: {
                        msg: 'Credenciales invalidas'
                    }
                },
                oldData: req.body,
            })
        }
        return res.render("../views/users/login", {
            errors: {
                email: {
                    msg: 'Email no registrado'
                }
            },
            oldData: req.body,
        })

    },

    userProfile: (req, res) => {

        return res.render("../views/users/profile", {
            user: req.session.userLogged
        });
    },

    userRegister: (req, res) => {

        return res.render("../views/users/register2")
    },

    addUser: (req, res) => {

        const userEmail = usersArray.find(user => user.email == req.body.email)

        let userDoublepass = undefined;
        if (req.body.contraseña == req.body.repetirContraseña) {
            userDoublepass = true;
        } else {
            userDoublepass = false;
        }

        const resultValidation = validationResult(req);
        if (!resultValidation.isEmpty()) {
            return res.render("../views/users/register2", { errors: resultValidation.mapped(), oldData: req.body, })
        } else {
            if (userEmail == undefined) {
                if (userDoublepass == true) {
                    if ((path.extname(req.file.filename) == ".jpg") || (path.extname(req.file.filename) == ".png")) {
                        
                        usersArray.push({
                            nombre: req.body.nombre,
                            apellido: req.body.apellido,
                            email: req.body.email,
                            pass: bcrypt.hashSync(req.body.contraseña, 10),
                            imagen: req.file && req.file.filename ? req.file.filename : "default-image.png",
                            id: generateID()
                        });
                        fs.writeFileSync(filePath, JSON.stringify(usersArray, null, ' '))
                        return res.redirect("/users/login")
                    } else {
                        return res.render("../views/users/register2", { errors: resultValidation.mapped(), oldData: req.body, })
                    }
                } else {
                    return res.render("../views/users/register2", { error: { contraseña: "Las contraseñas no coinciden" }, oldData: req.body })
                }
            } else {
                return res.render("../views/users/register2", { error: { correo: "Correo existente" }, oldData: req.body })
            }
        }
    },

    logOut: (req, res) => {

        res.clearCookie('userEmail');
        req.session.destroy();
        return res.redirect('/');

    }

};

module.exports = controller;