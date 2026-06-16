export const GLOSSARY = {
  'ransomware':           'Malicious software that encrypts your files and demands payment to restore access.',
  'phishing':             'A cyberattack where criminals send fake emails or messages to trick people into revealing passwords or personal information.',
  'malware':              'Any software designed to damage, disrupt, or gain unauthorized access to a computer system.',
  'data breach':          'An incident where confidential data is accessed or disclosed without authorization.',
  'exfiltration':         'The unauthorized transfer of data from a computer or network to a location controlled by the attacker.',
  'rdp':                  'Remote Desktop Protocol — software that lets someone control a computer over the internet from another location. Commonly exploited by attackers.',
  'cve':                  'Common Vulnerabilities and Exposures — a public catalog of known security flaws in software, each assigned a unique ID number.',
  'ioc':                  'Indicator of Compromise — digital evidence that a system has been breached, such as unusual files or unexpected network connections.',
  'lateral movement':     'When an attacker who has broken into one system quietly moves to other connected systems within the same network.',
  'privilege escalation': 'When an attacker gains more control over a system than they should have — for example, going from a basic user account to an administrator account.',
  'social engineering':   'Manipulating people psychologically to get them to reveal confidential information or take harmful actions, rather than hacking software directly.',
  'zero day':             'A security flaw that is unknown to the software maker and has no fix available yet, making it especially dangerous.',
  'zero-day':             'A security flaw that is unknown to the software maker and has no fix available yet, making it especially dangerous.',
  'payload':              'The part of a cyberattack that causes the actual damage — for example, the code that encrypts files or steals data.',
  'c2':                   'Command and Control — a server used by attackers to remotely send instructions to infected computers.',
  'ddos':                 'Distributed Denial of Service — an attack that floods a website or server with fake traffic to make it unavailable to real users.',
  'sql injection':        'A technique where attackers insert malicious code into a database query to steal, modify, or delete data.',
  'brute force':          'An attack that tries thousands of password combinations automatically until the correct one is found.',
  'mfa':                  'Multi-Factor Authentication — a security method requiring two or more forms of verification (e.g. a password plus a phone code) before granting access.',
  'endpoint':             'Any device connected to a network — laptops, desktops, phones, tablets, or servers.',
  'firewall':             'A security system that monitors and filters network traffic based on defined rules, blocking unauthorized access.',
  'vpn':                  'Virtual Private Network — an encrypted connection over the internet that keeps network activity private and secure.',
  'patch':                'A software update that fixes a security vulnerability or bug in an application or operating system.',
  'vulnerability':        'A weakness in a system, application, or process that an attacker could exploit to gain unauthorized access or cause harm.',
};

export const GLOSSARY_TERMS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);

const escaped = GLOSSARY_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
export const GLOSSARY_REGEX_SRC = `\\b(${escaped.join('|')})\\b`;
