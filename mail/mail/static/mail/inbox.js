document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#detail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#detail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get emails for mailbox
  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
        const div = document.createElement('div');
        document.querySelector('#emails-view').append(div);
        div.innerHTML = `<span style="font-weight: bold;">${email.sender}</span> ${email.subject} <span style="float: right;">${email.timestamp}</span>`;
        div.classList.add('email-content');

        if(email.read === true) {
            div.style.backgroundColor = "#dbdbdb";
        }

        div.addEventListener('click', function() {
            open_email(mailbox, email.id);
        });
    })
  })
  .catch(error => {
    console.log('Error:', error);
  });
}

function send_email() {
    //Get form data
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    //API call to send email
    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body
        })
    })
    .then(response => response.json())
    .then(result => {
        //if email is sent successfully
        if(!result.error) {
            load_mailbox('sent');
            alert(result.message);
        }
        else {
            alert(result.error);
        }
    })
    .catch(error => {
        console.log('Error:', error);
    });

    return false;
}

function open_email(mailbox, id) {
    //fetch email data using id
    fetch(`emails/${id}`)
    .then(response => response.json())
    .then(email => {
        if(!email.error) {
            //Hide other views
            document.querySelector('#emails-view').style.display = 'none';
            document.querySelector('#compose-view').style.display = 'none';

            //Display data
            const detailView = document.querySelector('#detail-view');
            detailView.style.display = 'block';
            if(mailbox === 'inbox') {
                detailView.innerHTML = `<p><span style="font-weight: bold;">From:</span> ${email.sender}</p>
                <p><span style="font-weight: bold;">To:</span> ${email.recipients}</p>
                <p><span style="font-weight: bold;">Subject:</span> ${email.subject}</p>
                <p><span style="font-weight: bold;">Timestamp:</span> ${email.timestamp}</p>
                <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button> <button class="btn btn-sm btn-outline-primary" id="archive">Archive</button>
                <hr>
                <p>${email.body}</p>`

                //Add event listener to archive button
                document.querySelector('#archive').addEventListener('click', function() {
                    archive_email(id);
                });
            }
            else if(mailbox === 'archive') {
                detailView.innerHTML = `<p><span style="font-weight: bold;">From:</span> ${email.sender}</p>
                <p><span style="font-weight: bold;">To:</span> ${email.recipients}</p>
                <p><span style="font-weight: bold;">Subject:</span> ${email.subject}</p>
                <p><span style="font-weight: bold;">Timestamp:</span> ${email.timestamp}</p>
                <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button> <button class="btn btn-sm btn-outline-primary" id="unarchive">Unarchive</button>
                <hr>
                <p>${email.body}</p>`

                //Add event listener to unarchive button
                document.querySelector('#unarchive').addEventListener('click', function() {
                    unarchive_email(id);
                });
            }
            else {
                detailView.innerHTML = `<p><span style="font-weight: bold;">From:</span> ${email.sender}</p>
                <p><span style="font-weight: bold;">To:</span> ${email.recipients}</p>
                <p><span style="font-weight: bold;">Subject:</span> ${email.subject}</p>
                <p><span style="font-weight: bold;">Timestamp:</span> ${email.timestamp}</p>
                <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>
                <hr>
                <p>${email.body}</p>`
            }

            //Mark email as read
            fetch(`emails/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    read: true
                })
            })

            //AddEventListener to reply button
            document.querySelector('#reply').addEventListener('click', function() {
                reply_email(email.sender, email.subject, email.body, email.timestamp);
            });
        }
        else {
            alert(email.error);
        }
    })
    .catch(error => {
        console.log('Error', error);
    });
}

function reply_email(recipients, subject, body, timestamp) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#detail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Pre-fill composition fields
  document.querySelector('#compose-recipients').value = recipients;

  if(!subject.includes('RE:')) {
    document.querySelector('#compose-subject').value = `RE: ${subject}`;
  }
  else {
    document.querySelector('#compose-subject').value = subject;
  }

  document.querySelector('#compose-body').value = `On ${timestamp} ${recipients} wrote:\n${body}`;
}

function archive_email(id) {
    fetch(`emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: true
        })
    })
    .then(load_mailbox('inbox'));
}

function unarchive_email(id) {
    fetch(`emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: false
        })
    })
    .then(load_mailbox('inbox'));
}