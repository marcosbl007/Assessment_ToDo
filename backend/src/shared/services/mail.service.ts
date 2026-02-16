import nodemailer from 'nodemailer';

interface SendSupervisorInviteEmailPayload {
  to: string;
  fullName: string;
  organizationalUnit: string;
  token: string;
  expiresInLabel: string;
}

interface MailTransportContext {
  transporter: nodemailer.Transporter;
  from: string;
}

export interface SendSupervisorInviteEmailResult {
  provider: 'ethereal';
  previewUrl: string;
}

export class MailService {
  private transportContextPromise: Promise<MailTransportContext> | null = null;

  private getTransportContext(): Promise<MailTransportContext> {
    if (this.transportContextPromise) {
      return this.transportContextPromise;
    }

    this.transportContextPromise = (async () => {
      const testAccount = await nodemailer.createTestAccount();

      const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      await transporter.verify();

      return {
        transporter,
        from: `Assessment Todo <${testAccount.user}>`,
      };
    })();

    return this.transportContextPromise;
  }

  async sendSupervisorInviteEmail(payload: SendSupervisorInviteEmailPayload): Promise<SendSupervisorInviteEmailResult> {
    const transportContext = await this.getTransportContext();

    const info = await transportContext.transporter.sendMail({
      from: transportContext.from,
      to: payload.to,
      subject: 'Token de autorización para registro Supervisor',
      text: [
        `Hola ${payload.fullName},`,
        '',
        'Recibimos tu solicitud de acceso como Supervisor.',
        `Unidad organizacional: ${payload.organizationalUnit}`,
        '',
        'Usa el siguiente token en el formulario de registro:',
        payload.token,
        '',
        `Vigencia del token: ${payload.expiresInLabel}.`,
        'Si no solicitaste este acceso, ignora este correo.',
      ].join('\n'),
      html: `
        <p>Hola <strong>${payload.fullName}</strong>,</p>
        <p>Recibimos tu solicitud de acceso como Supervisor.</p>
        <p><strong>Unidad organizacional:</strong> ${payload.organizationalUnit}</p>
        <p>Usa el siguiente token en el formulario de registro:</p>
        <p style="font-size:16px;font-weight:700;word-break:break-all;">${payload.token}</p>
        <p><strong>Vigencia del token:</strong> ${payload.expiresInLabel}.</p>
        <p>Si no solicitaste este acceso, ignora este correo.</p>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (!previewUrl) {
      throw new Error('No se pudo generar URL de vista previa de Ethereal.');
    }

    return {
      provider: 'ethereal',
      previewUrl,
    };
  }
}
