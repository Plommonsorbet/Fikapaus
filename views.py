__author__ = 'Plommonsorbet'


from flask import Flask, render_template, request
import smtplib
from email.mime.text import MIMEText
app = Flask(__name__)


@app.route('/')
def home():
    return render_template('home.html')


@app.route('/metronome')
def metronome():
    return render_template('metronome.html')


@app.route('/chromatic-tuner')
def chromatic_tuner():
    return render_template('chromatic_tuner.html')


@app.route('/feedback/', methods=['GET', 'POST'])
def feedback():
    subject = request.args.get('subject', '')
    instrument = request.args.get('instrument', '')
    email = request.args.get('email', '')
    description = request.args.get('description', '')


    if request.method == 'POST':
        subject = request.form.get('subject')
        instrument = request.form.get('instrument')
        email = request.form.get('email')
        description = request.form.get('description')
        scroll_to_form = True
        if subject == '':
            subject_message = 'You need a subject! ;)'
        else:
            subject_message = ''
        if description == '':
            description_message = 'You need a description of your inquiry.'
        else:
            description_message = ''
        if email == '':
            email_message = 'You need to enter your email! :3'
        else:
            email_message = ''

        if email and subject and description:

            msg = msg = MIMEText(description)
            if instrument != '':
                msg['Subject'] = subject + '- ' + instrument
            else:
                msg['subject'] = subject
            msg['From'] = email
            msg['To'] = 'inquiries@fikapaus.io'


            smtp = smtplib.SMTP('mail2.bahnhof.se')
            smtp.sendmail(email, 'inquiries@fikapaus.io', msg.as_string())
            smtp.quit()

        return render_template('feedback.html', subject=subject_message, description=description_message,
                               email=email_message,  scroll_to_form=scroll_to_form)

    return render_template('feedback.html')


@app.route('/contact', methods=['GET', 'POST'])
def contact():


    return render_template('contact.html')


app.run(debug=True, host='0.0.0.0', port=1111)