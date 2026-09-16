// sicrcb-backend/services/AuthService.js
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const UsuarioModel = require('../models/UsuarioModel');

// Configuración del transporte de correo en el backend
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

class AuthService {
    // 1. Lógica de Login
    static async autenticar(email, contraseña) {
        const usuario = await UsuarioModel.validarCredenciales(email, contraseña);

        if (!usuario) {
            const error = new Error('Credenciales inválidas');
            error.statusCode = 401;
            throw error;
        }

        if (usuario.estado !== 'Activo') {
            const error = new Error('Su cuenta se encuentra inactiva. Comuníquese con la administración del conjunto.');
            error.statusCode = 403;
            throw error;
        }

        return usuario;
    }

    // 2. Lógica de Solicitar Recuperación
    static async solicitarRecuperacion(email, baseUrl) {
        const usuario = await UsuarioModel.buscarPorEmail(email);

        if (!usuario) {
            const error = new Error('No existe ninguna cuenta registrada con este correo.');
            error.statusCode = 404;
            throw error;
        }

        // Token temporal de 30 minutos
        const tokenRecuperacion = jwt.sign(
            { id: usuario.id, email: usuario.email, proposito: 'recuperacion' },
            process.env.JWT_SECRET,
            { expiresIn: '30m' }
        );

        const enlaceRecuperacion = `${baseUrl}/restablecer-password?token=${tokenRecuperacion}`;

        console.log('----------------------------------------------------');
        console.log('ENLACE DE RECUPERACIÓN GENERADO:');
        console.log(enlaceRecuperacion);
        console.log('----------------------------------------------------');

        const mailOptions = {
            from: `"SICRCB Casa Blanca" <${process.env.EMAIL_USER || 'no-reply@sicrcb.com'}>`,
            to: usuario.email,
            subject: 'Restablecimiento de Contraseña - SICRCB Casa Blanca',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #fcf9f6; border-radius: 12px; overflow: hidden; border: 1px solid rgba(140,50,0,0.15);">
                  <div style="background: linear-gradient(135deg, #8c3200 0%, #6e2600 100%); padding: 24px; text-align: center; color: #ffffff;">
                    <h2 style="margin: 0; font-size: 22px; color: #ffd0a0;">SICRCB CASA BLANCA</h2>
                    <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Recuperación de Acceso al Sistema</p>
                  </div>
                  <div style="padding: 28px; color: #2c1203;">
                    <p style="font-size: 16px; margin-top: 0;">Hola,</p>
                    <p style="font-size: 14px; line-height: 1.6; color: #594234;">
                      Has solicitado restablecer tu contraseña para ingresar al sistema de convivencia y administración del <strong>Conjunto Residencial Casa Blanca</strong>.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${enlaceRecuperacion}" style="background-color: #f47820; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 25px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(244,120,32,0.3);">
                        Restablecer mi Contraseña
                      </a>
                    </div>
                    <p style="font-size: 12px; color: #8c7364; line-height: 1.5;">
                      Este enlace es de un solo uso y vencerá en <strong>30 minutos</strong>. Si no realizaste esta solicitud, puedes ignorar este mensaje de forma segura.
                    </p>
                  </div>
                  <div style="background-color: #f5ebe1; padding: 14px; text-align: center; font-size: 11px; color: #8c3200;">
                    Conjunto Residencial Casa Blanca &bull; Sistema Integral de Gestión
                  </div>
                </div>
            `
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail(mailOptions);
        }

        return { message: 'Correo de recuperación enviado exitosamente.' };
    }

    // 3. Lógica de Restablecer Contraseña
    static async restablecerPassword(token, nuevaPassword) {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);

        if (decodificado.proposito !== 'recuperacion') {
            const error = new Error('Token no autorizado para esta operación.');
            error.statusCode = 400;
            throw error;
        }

        await UsuarioModel.actualizarPassword(decodificado.id, nuevaPassword);
        return { message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.' };
    }
}

module.exports = AuthService;