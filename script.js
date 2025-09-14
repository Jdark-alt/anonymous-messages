// Replace with YOUR Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCl6BdJL3vEJP1PHfxSbDWNll972p_qn4U",
  authDomain: "anonymous-messages-app-215dc.firebaseapp.com",
  projectId: "anonymous-messages-app-215dc",
  storageBucket: "anonymous-messages-app-215dc.firebasestorage.app",
  messagingSenderId: "369821019026",
  appId: "1:369821019026:web:350f0819d5390429246f4b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Create Profile functionality
if (document.getElementById('profileForm')) {
    document.getElementById('profileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const displayName = document.getElementById('displayName').value;
        const passcode = document.getElementById('passcode').value;
        const createBtn = document.getElementById('createBtn');
        
        createBtn.textContent = 'Creating...';
        createBtn.disabled = true;
        
        try {
            // Check if display name exists
            const existingProfiles = await db.collection('profiles').where('displayName', '==', displayName).get();
            
            if (!existingProfiles.empty) {
                alert('Display name already exists. Please choose another.');
                createBtn.textContent = 'Create Profile';
                createBtn.disabled = false;
                return;
            }
            
            // Create profile
            const docRef = await db.collection('profiles').add({
                displayName: displayName,
                passcode: passcode,
                createdAt: new Date(),
                messageCount: 0
            });
            
            // Show success message with CORRECTED URLs
            const profileUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}send.html?id=${docRef.id}`;
            const dashboardUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}dashboard.html?id=${docRef.id}`;
            
            document.getElementById('profileUrl').value = profileUrl;
            document.getElementById('dashboardLink').href = dashboardUrl;
            
            document.getElementById('createForm').style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error creating profile. Please try again.');
            createBtn.textContent = 'Create Profile';
            createBtn.disabled = false;
        }
    });
}

// Quick Login functionality
if (document.getElementById('quickLoginForm')) {
    document.getElementById('quickLoginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const profileId = document.getElementById('existingProfileId').value.trim();
        const passcode = document.getElementById('existingPasscode').value;
        const loginBtn = document.getElementById('loginBtn');
        
        loginBtn.textContent = 'Checking...';
        loginBtn.disabled = true;
        
        try {
            const doc = await db.collection('profiles').doc(profileId).get();
            
            if (doc.exists && doc.data().passcode === passcode) {
                // Redirect to dashboard
                window.location.href = `dashboard.html?id=${profileId}`;
            } else {
                alert('Invalid Profile ID or passcode. Please check your details.');
            }
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error accessing profile. Please check your Profile ID.');
        }
        
        loginBtn.textContent = 'Access My Dashboard';
        loginBtn.disabled = false;
    });
}

// Profile ID Finder functionality
function showProfileIdFinder() {
    document.getElementById('profileIdModal').style.display = 'flex';
}

function hideProfileIdFinder() {
    document.getElementById('profileIdModal').style.display = 'none';
    document.getElementById('foundProfile').style.display = 'none';
    document.getElementById('findProfileForm').reset();
}

if (document.getElementById('findProfileForm')) {
    document.getElementById('findProfileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const displayName = document.getElementById('findDisplayName').value;
        const passcode = document.getElementById('findPasscode').value;
        
        try {
            const querySnapshot = await db.collection('profiles')
                .where('displayName', '==', displayName)
                .where('passcode', '==', passcode)
                .get();
            
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                document.getElementById('foundProfileId').value = doc.id;
                document.getElementById('foundProfile').style.display = 'block';
            } else {
                alert('No profile found with those credentials.');
            }
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error searching for profile.');
        }
    });
}

// Copy to clipboard function
function copyToClipboard() {
    const profileUrl = document.getElementById('profileUrl');
    profileUrl.select();
    document.execCommand('copy');
    alert('Link copied to clipboard!');
}

// Load profile for sending message
async function loadProfileForSending(profileId) {
    try {
        const doc = await db.collection('profiles').doc(profileId).get();
        
        if (doc.exists) {
            const profile = doc.data();
            document.getElementById('profileName').textContent = profile.displayName;
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('profileInfo').style.display = 'block';
            document.getElementById('messageForm').style.display = 'block';
            
            // Handle message form
            document.getElementById('messageForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const content = document.getElementById('messageContent').value;
                const sendBtn = document.getElementById('sendBtn');
                
                sendBtn.textContent = 'Sending...';
                sendBtn.disabled = true;
                
                try {
                    // Generate a unique conversation ID for bidirectional chat
                    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    
                    // Create the message with conversation tracking
                    const docRef = await db.collection('messages').add({
                        profileId: profileId,
                        conversationId: conversationId,
                        content: content,
                        timestamp: new Date(),
                        isAnonymous: true,
                        responses: [],
                        senderCanReply: true
                    });
                    
                    // Show success with conversation link
                    document.getElementById('messageForm').style.display = 'none';
                    document.getElementById('sentMessage').style.display = 'block';
                    
                    // Add the conversation link
                    const chatLink = `${window.location.origin}${window.location.pathname.replace('send.html', '')}chat.html?conv=${conversationId}`;
                    
                    document.getElementById('sentMessage').innerHTML = `
                        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                            <h3 class="text-lg font-semibold">Message Sent!</h3>
                            <p class="text-sm mt-1">Your anonymous message has been delivered.</p>
                        </div>
                        
                        <div class="bg-blue-50 border border-blue-200 p-4 rounded mb-6">
                            <p class="text-sm text-blue-700 mb-2">💬 <strong>Want to see if they reply?</strong></p>
                            <p class="text-xs text-blue-600 mb-3">Bookmark this link to check for replies:</p>
                            <div class="flex">
                                <input type="text" id="chatLink" value="${chatLink}" readonly class="flex-1 p-2 bg-white border border-gray-300 rounded-l-md text-xs">
                                <button onclick="copyChatLink()" class="bg-blue-500 text-white px-3 py-1 rounded-r-md hover:bg-blue-600 text-xs">Copy</button>
                            </div>
                        </div>
                        
                        <div class="space-y-3">
                            <a href="${chatLink}" class="block w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 text-center">
                                Go to Conversation
                            </a>
                            <button onclick="sendAnother()" class="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                                Send Another Message
                            </button>
                            <a href="search.html" class="block w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 text-center">
                                Find Other Profiles
                            </a>
                        </div>
                    `;
                    
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error sending message. Please try again.');
                    sendBtn.textContent = 'Send Anonymous Message';
                    sendBtn.disabled = false;
                }
            });
            
        } else {
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'block';
    }
}

// Copy chat link function
function copyChatLink() {
    const chatLink = document.getElementById('chatLink');
    chatLink.select();
    document.execCommand('copy');
    alert('Conversation link copied! Bookmark this to check for replies.');
}

// Send another message function
function sendAnother() {
    document.getElementById('messageContent').value = '';
    document.getElementById('sentMessage').style.display = 'none';
    document.getElementById('messageForm').style.display = 'block';
    document.getElementById('sendBtn').textContent = 'Send Anonymous Message';
    document.getElementById('sendBtn').disabled = false;
}

// Dashboard functionality
async function initDashboard(profileId) {
    document.getElementById('authForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const passcode = document.getElementById('loginPasscode').value;
        const authBtn = document.getElementById('authBtn');
        
        authBtn.textContent = 'Checking...';
        authBtn.disabled = true;
        
        try {
            const doc = await db.collection('profiles').doc(profileId).get();
            
            if (doc.exists && doc.data().passcode === passcode) {
                const profile = doc.data();
                
                // Show dashboard
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('dashboardContent').style.display = 'block';
                document.getElementById('profileDisplayName').textContent = profile.displayName;
                
                // FIXED: Correct URL generation
                const shareUrl = `${window.location.origin}${window.location.pathname.replace('dashboard.html', '')}send.html?id=${profileId}`;
                document.getElementById('shareUrl').value = shareUrl;
                
                // Load messages
                loadMessages(profileId);
                
            } else {
                alert('Invalid passcode. Please try again.');
                authBtn.textContent = 'Access Dashboard';
                authBtn.disabled = false;
            }
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error accessing dashboard. Please try again.');
            authBtn.textContent = 'Access Dashboard';
            authBtn.disabled = false;
        }
    });
}

// Load messages for dashboard
function loadMessages(profileId) {
    db.collection('messages')
        .where('profileId', '==', profileId)
        .orderBy('timestamp', 'desc')
        .onSnapshot(function(querySnapshot) {
            const messages = [];
            querySnapshot.forEach(function(doc) {
                messages.push({ id: doc.id, ...doc.data() });
            });
            
            document.getElementById('messageCount').textContent = `${messages.length} message${messages.length !== 1 ? 's' : ''}`;
            
            if (messages.length === 0) {
                document.getElementById('messagesContainer').innerHTML = `
                    <div class="text-center py-16 bg-white rounded-lg shadow-md">
                        <div class="text-gray-400 text-6xl mb-4">📭</div>
                        <h3 class="text-xl font-medium text-gray-600 mb-2">No messages yet</h3>
                        <p class="text-gray-500">Share your profile link to start receiving anonymous messages!</p>
                    </div>
                `;
            } else {
                displayMessages(messages);
            }
        });
}

// Display messages
function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'bg-white rounded-lg shadow-md p-6 mb-4';
        
        const chatLink = message.conversationId ? 
            `${window.location.origin}${window.location.pathname.replace('dashboard.html', '')}chat.html?conv=${message.conversationId}` : 
            null;
        
        messageDiv.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                        <span class="text-white text-sm">?</span>
                    </div>
                    <span class="font-medium text-gray-600">Anonymous User</span>
                </div>
                <div class="text-right">
                    <span class="text-xs text-gray-400 block">${message.timestamp?.toDate?.()?.toLocaleString() || 'Just now'}</span>
                    ${chatLink ? `<a href="${chatLink}" class="text-xs text-blue-500 hover:text-blue-700">View Full Chat</a>` : ''}
                </div>
            </div>
            
            <p class="text-gray-800 mb-4 text-lg">${message.content}</p>
            
            ${message.responses && message.responses.length > 0 ? `
                <div class="bg-gray-50 rounded-md p-4 mb-4">
                    <h4 class="text-sm font-semibold mb-3 text-gray-700">Conversation:</h4>
                    <div class="space-y-3">
                        ${message.responses.map(response => `
                            <div class="${response.isOwner ? 'bg-blue-100 border-l-4 border-blue-400' : 'bg-white border-l-4 border-gray-300'} p-3 rounded-md">
                                <div class="flex justify-between text-xs text-gray-500 mb-1">
                                    <span class="font-medium">${response.isOwner ? 'You' : 'Anonymous'}</span>
                                    <span>${response.timestamp?.toDate?.()?.toLocaleString()}</span>
                                </div>
                                <p class="text-gray-800">${response.content}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div id="reply-${message.id}" class="hidden bg-blue-50 p-4 rounded-md">
                <textarea id="replyText-${message.id}" placeholder="Write your reply..." class="w-full p-3 border border-gray-300 rounded-md mb-3 h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                <div class="flex gap-2">
                    <button onclick="sendReply('${message.id}')" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Send Reply</button>
                    <button onclick="cancelReply('${message.id}')" class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">Cancel</button>
                </div>
            </div>
            
            <button onclick="showReply('${message.id}')" id="replyBtn-${message.id}" class="text-blue-500 hover:text-blue-700 font-medium">💬 Reply to this message</button>
        `;
        
        container.appendChild(messageDiv);
    });
}

// Reply functions
function showReply(messageId) {
    document.getElementById(`reply-${messageId}`).style.display = 'block';
    document.getElementById(`replyBtn-${messageId}`).style.display = 'none';
}

function cancelReply(messageId) {
    document.getElementById(`reply-${messageId}`).style.display = 'none';
    document.getElementById(`replyBtn-${messageId}`).style.display = 'block';
    document.getElementById(`replyText-${messageId}`).value = '';
}

async function sendReply(messageId) {
    const replyText = document.getElementById(`replyText-${messageId}`).value;
    if (!replyText.trim()) return;
    
    try {
        const messageRef = db.collection('messages').doc(messageId);
        const messageDoc = await messageRef.get();
        const currentMessage = messageDoc.data();
        
        await messageRef.update({
            responses: [...(currentMessage.responses || []), {
                content: replyText,
                timestamp: new Date(),
                isOwner: true
            }]
        });
        
        cancelReply(messageId);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error sending reply. Please try again.');
    }
}

// Copy share URL
function copyShareUrl() {
    const shareUrl = document.getElementById('shareUrl');
    shareUrl.select();
    document.execCommand('copy');
    alert('Link copied to clipboard!');
}

// Search functionality
if (document.getElementById('searchForm')) {
    document.getElementById('searchForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const searchTerm = document.getElementById('searchTerm').value;
        const searchBtn = document.getElementById('searchBtn');
        
        searchBtn.textContent = 'Searching...';
        searchBtn.disabled = true;
        
        try {
            const querySnapshot = await db.collection('profiles')
                .where('displayName', '>=', searchTerm)
                .where('displayName', '<=', searchTerm + '\uf8ff')
                .get();
            
            const results = [];
            querySnapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });
            
            displaySearchResults(results, searchTerm);
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error searching profiles. Please try again.');
        }
        
        searchBtn.textContent = 'Search';
        searchBtn.disabled = false;
    });
}

function displaySearchResults(results, searchTerm) {
    const container = document.getElementById('searchResults');
    const noResults = document.getElementById('noResults');
    
    if (results.length === 0) {
        container.innerHTML = '';
        noResults.querySelector('p').innerHTML = `No profiles matching "<strong>${searchTerm}</strong>" were found.`;
        noResults.style.display = 'block';
    } else {
        noResults.style.display = 'none';
        
        // FIXED: Correct URL generation for search results
        const basePath = window.location.pathname.replace('search.html', '');
        
        container.innerHTML = results.map(profile => `
            <div class="bg-white rounded-lg shadow-md p-6 flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">${profile.displayName}</h3>
                    <div class="flex items-center text-sm text-gray-500 space-x-4">
                        <span>📅 Created ${profile.createdAt?.toDate?.()?.toLocaleDateString()}</span>
                        <span>💬 Profile ID: ${profile.id.slice(0, 8)}...</span>
                    </div>
                </div>
                <a href="${basePath}send.html?id=${profile.id}" class="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 font-medium">
                    Send Message →
                </a>
            </div>
        `).join('');
    }
}

// Chat functionality for bidirectional conversations
async function initChat(conversationId) {
    try {
        // Load the conversation
        const querySnapshot = await db.collection('messages').where('conversationId', '==', conversationId).get();
        
        if (querySnapshot.empty) {
            document.getElementById('chatContainer').innerHTML = `
                <div class="text-center py-16">
                    <div class="text-red-500 text-6xl mb-4">❌</div>
                    <h3 class="text-xl font-medium text-gray-600 mb-2">Conversation not found</h3>
                    <p class="text-gray-500">The conversation link may be invalid or expired.</p>
                </div>
            `;
            return;
        }
        
        let messageData = null;
        querySnapshot.forEach(doc => {
            messageData = { id: doc.id, ...doc.data() };
        });
        
        if (messageData) {
            displayChatConversation(messageData);
            
            // Listen for real-time updates
            db.collection('messages').doc(messageData.id).onSnapshot(doc => {
                if (doc.exists) {
                    displayChatConversation({ id: doc.id, ...doc.data() });
                }
            });
        }
        
    } catch (error) {
        console.error('Error loading chat:', error);
        document.getElementById('chatContainer').innerHTML = `
            <div class="text-center py-16">
                <div class="text-red-500 text-6xl mb-4">❌</div>
                <h3 class="text-xl font-medium text-gray-600 mb-2">Error loading conversation</h3>
                <p class="text-gray-500">Please try again later.</p>
            </div>
        `;
    }
}

function displayChatConversation(messageData) {
    const container = document.getElementById('chatContainer');
    
    container.innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-800">Anonymous Conversation</h2>
                <span class="text-sm text-gray-500">
                    Started ${messageData.timestamp?.toDate?.()?.toLocaleDateString()}
                </span>
            </div>
            
            <div class="space-y-4">
                <!-- Original Message -->
                <div class="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <div class="flex justify-between items-start mb-2">
                        <span class="font-medium text-blue-700">Anonymous Sender</span>
                        <span class="text-xs text-blue-600">${messageData.timestamp?.toDate?.()?.toLocaleString()}</span>
                    </div>
                    <p class="text-gray-800">${messageData.content}</p>
                </div>
                
                <!-- Responses -->
                <div id="chatResponses" class="space-y-3">
                    ${messageData.responses ? messageData.responses.map(response => `
                        <div class="${response.isOwner ? 'bg-green-50 border-l-4 border-green-400' : 'bg-gray-50 border-l-4 border-gray-400'} p-4 rounded">
                            <div class="flex justify-between items-start mb-2">
                                <span class="font-medium ${response.isOwner ? 'text-green-700' : 'text-gray-700'}">
                                    ${response.isOwner ? 'Profile Owner' : 'Anonymous Sender'}
                                </span>
                                <span class="text-xs ${response.isOwner ? 'text-green-600' : 'text-gray-600'}">
                                    ${response.timestamp?.toDate?.()?.toLocaleString()}
                                </span>
                            </div>
                            <p class="text-gray-800">${response.content}</p>
                        </div>
                    `).join('') : ''}
                </div>
            </div>
        </div>
        
        <!-- Reply Form -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-medium mb-4">Continue the conversation</h3>
            <form id="chatReplyForm">
                <textarea id="chatReplyText" placeholder="Write your reply..." class="w-full p-3 border border-gray-300 rounded-md mb-3 h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required></textarea>
                <button type="submit" class="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600">Send Reply</button>
            </form>
        </div>
    `;
    
    // Handle chat replies
    document.getElementById('chatReplyForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const replyText = document.getElementById('chatReplyText').value.trim();
        if (!replyText) return;
        
        try {
            const messageRef = db.collection('messages').doc(messageData.id);
            
            await messageRef.update({
                responses: [...(messageData.responses || []), {
                    content: replyText,
                    timestamp: new Date(),
                    isOwner: false  // This is the anonymous sender replying
                }]
            });
            
            document.getElementById('chatReplyText').value = '';
            
        } catch (error) {
            console.error('Error sending reply:', error);
            alert('Error sending reply. Please try again.');
        }
    });
}
