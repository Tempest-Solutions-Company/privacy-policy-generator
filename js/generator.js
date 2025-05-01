/**
 * Privacy Policy Generator
 * Core functionality for generating comprehensive privacy policies based on user inputs
 */

class PrivacyPolicyGenerator {
  constructor() {
    this.templates = {};
    this.jurisdictions = {};
    this.comprehensiveTemplate = {};
    this.debug = true; // Enable debugging
    
    // Initialize with loading necessary data
    this.loadTemplates();
    this.loadJurisdictions();
    this.loadComprehensiveTemplate();
  }
  
  // Helper method for logging
  log(message, data) {
    if (this.debug) {
      console.log(`[PolicyGenerator] ${message}`, data || '');
    }
  }
  
  async loadTemplates() {
    try {
      this.log('Loading templates...');
      const response = await fetch('./data/templates.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.templates = await response.json();
      this.log('Templates loaded successfully', this.templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      this.log('Using fallback templates');
      // Fallback to embedded minimal templates if fetch fails
      this.templates = {
        version: "1.0",
        ecommerce: { 
          name: "E-Commerce",
          specifics: []
        },
        blog: { 
          name: "Blog/Content Site",
          specifics: []
        },
        saas: { 
          name: "SaaS/Web App",
          specifics: []
        },
        mobile: { 
          name: "Mobile App",
          specifics: []
        },
        nonprofit: { 
          name: "Non-Profit",
          specifics: []
        },
        general: {
          name: "General Website",
          specifics: []
        }
      };
    }
  }
  
  async loadJurisdictions() {
    try {
      this.log('Loading jurisdictions...');
      const response = await fetch('./data/jurisdictions.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.jurisdictions = await response.json();
      this.log('Jurisdictions loaded successfully', this.jurisdictions);
    } catch (error) {
      console.error('Failed to load jurisdictions:', error);
      this.log('Using fallback jurisdictions');
      // Fallback to embedded minimal jurisdiction rules
      this.jurisdictions = {
        us: { name: "United States", dataRights: "Various rights under state laws" },
        eu: { name: "European Union (GDPR)", dataRights: "Rights under GDPR" },
        uk: { name: "United Kingdom", dataRights: "Rights under UK GDPR" },
        ca: { name: "Canada", dataRights: "Rights under PIPEDA" },
        au: { name: "Australia", dataRights: "Rights under Privacy Act" },
        global: { name: "Global", dataRights: "Basic data rights" }
      };
    }
  }
  
  async loadComprehensiveTemplate() {
    try {
      this.log('Loading comprehensive template...');
      const response = await fetch('./data/comprehensive-template.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.comprehensiveTemplate = await response.json();
      this.log('Comprehensive template loaded successfully');
    } catch (error) {
      console.error('Failed to load comprehensive template:', error);
      this.log('Using fallback comprehensive template');
      // Fallback to basic structure if fetch fails
      this.comprehensiveTemplate = {
        version: "1.0",
        sections: [
          {
            id: "introduction",
            title: "1. Introduction",
            required: true,
            content: "This is a basic privacy policy for {business_name}."
          },
          {
            id: "information_collected",
            title: "2. Information We Collect",
            required: true,
            content: "We collect basic information necessary to provide our services."
          },
          {
            id: "contact_us",
            title: "3. Contact Us",
            required: true,
            content: "If you have questions, contact {business_name}."
          }
        ]
      };
    }
  }
  
  generate(formData) {
    try {
      this.log('Generating policy with data:', formData);
      
      // Check if necessary data is loaded
      if (!this.comprehensiveTemplate.sections || this.comprehensiveTemplate.sections.length === 0) {
        throw new Error('Comprehensive template not properly loaded');
      }
      
      // Extract data from form
      const {
        businessName,
        businessType,
        jurisdiction,
        dataCollected = [],
        thirdParties = [],
        contactEmail = '',
        contactPhone = '',
        businessAddress = '',
        contactPage = '',
        websiteUrl = '',
        country = 'United States', // Default value
        sellRegions = [] // Additional regions where business operates
      } = formData;
      
      // Validate required fields
      if (!businessName) throw new Error('Business name is required');
      if (!businessType) throw new Error('Business type is required');
      if (!jurisdiction) throw new Error('Jurisdiction is required');
      
      this.log('Preparing data for template');
      
      // Generate the comprehensive policy
      const policy = this.generateComprehensivePolicy({
        business_name: businessName,
        service_type: this.getServiceType(businessType),
        jurisdiction,
        sellRegions,
        data_collected: dataCollected,
        third_parties: thirdParties,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        business_address: businessAddress,
        contact_page: contactPage,
        website_url: websiteUrl,
        country,
        financial_processors: this.getFinancialProcessors(thirdParties),
        effective_date: new Date().toLocaleDateString()
      });
      
      this.log('Policy generated successfully');
      
      return {
        html: this.formatAsHTML(policy, businessName),
        markdown: this.formatAsMarkdown(policy, businessName),
        text: this.formatAsText(policy, businessName)
      };
    } catch (error) {
      console.error('Error generating policy:', error);
      throw new Error(`Failed to generate policy: ${error.message}`);
    }
  }
  
  getServiceType(businessType) {
    const types = {
      'ecommerce': 'online store and services',
      'blog': 'website and blog',
      'saas': 'software as a service',
      'mobile': 'mobile application',
      'nonprofit': 'website and services'
    };
    
    return types[businessType] || 'website and services';
  }
  
  getFinancialProcessors(thirdParties) {
    if (thirdParties && thirdParties.includes('payment')) {
      return ' (such as PayPal, Stripe, etc.)';
    }
    return '';
  }
  
  generateComprehensivePolicy(data) {
    try {
      this.log('Generating comprehensive policy with data');
      
      const { sections } = this.comprehensiveTemplate;
      if (!sections || !Array.isArray(sections)) {
        throw new Error('Template sections not properly defined');
      }
      
      const policySections = [];
      
      // Handle primary jurisdiction first (based on where business is located)
      const primaryJurisdiction = data.jurisdiction;
      
      // Also consider regions where business sells to or operates in
      const sellRegions = data.sellRegions || [];
      
      for (const section of sections) {
        try {
          // Skip sections that don't apply based on conditions
          if (section.condition) {
            // Support for sell regions - if condition checks jurisdiction, also check sell regions
            if (section.condition.includes('jurisdiction ===')) {
              const regionMatch = section.condition.match(/jurisdiction === ['"]([^'"]+)['"]/);
              if (regionMatch && regionMatch[1]) {
                const region = regionMatch[1];
                // Include section if it's either the primary jurisdiction OR in sell regions
                const conditionMet = (primaryJurisdiction === region) || sellRegions.includes(region);
                
                if (conditionMet) {
                  this.log(`Including section ${section.id} - matches primary jurisdiction or sell regions`);
                } else {
                  this.log(`Skipping section ${section.id} - condition not met for any jurisdiction`);
                  continue;
                }
              } else {
                // Fall back to normal condition evaluation if we can't parse it
                const conditionMet = this.evaluateCondition(section.condition, data);
                if (!conditionMet) {
                  this.log(`Skipping section ${section.id} - condition not met`);
                  continue;
                }
              }
            } else {
              // Regular condition evaluation for non-jurisdiction conditions
              const conditionMet = this.evaluateCondition(section.condition, data);
              if (!conditionMet) {
                this.log(`Skipping section ${section.id} - condition not met`);
                continue;
              }
            }
          }
          
          this.log(`Processing section: ${section.id}`);
          
          // Process the section's content with the data
          let content = section.content;
          if (content) {
            content = this.replaceVariables(content, data);
          } else {
            content = ""; // Handle missing content
          }
          
          // Process any subsections
          if (section.subsections && section.subsections.length > 0) {
            for (const subsection of section.subsections) {
              try {
                // Skip subsections that don't apply based on conditions
                if (subsection.condition) {
                  const subConditionMet = this.evaluateCondition(subsection.condition, data);
                  if (!subConditionMet) {
                    this.log(`Skipping subsection ${subsection.id} - condition not met`);
                    continue;
                  }
                }
                
                this.log(`Processing subsection: ${subsection.id}`);
                
                // Process the subsection's content with the data
                if (subsection.content) {
                  const subContent = this.replaceVariables(subsection.content, data);
                  
                  // Add subsection to content
                  content += `\n\n${subsection.title}\n\n${subContent}`;
                }
              } catch (subError) {
                console.error(`Error processing subsection ${subsection.id}:`, subError);
                // Continue with other subsections even if one fails
              }
            }
          }
          
          policySections.push({
            title: section.title,
            content: content
          });
        } catch (sectionError) {
          console.error(`Error processing section ${section.id}:`, sectionError);
          // Continue with other sections even if one fails
        }
      }
      
      return {
        businessName: data.business_name,
        sections: policySections,
        effectiveDate: data.effective_date
      };
    } catch (error) {
      console.error('Error in generateComprehensivePolicy:', error);
      throw error;
    }
  }
  
  evaluateCondition(condition, data) {
    try {
      this.log(`Evaluating condition: ${condition}`);
      
      // Special handling for common conditions
      if (condition.includes('.includes(')) {
        // Handle array includes conditions safely
        const match = condition.match(/([a-zA-Z_]+)\.includes\('([^']+)'\)/);
        if (match) {
          const [, arrayName, value] = match;
          const array = data[arrayName];
          if (Array.isArray(array)) {
            return array.includes(value);
          }
          return false;
        }
      }
      
      // For simple equality checks
      if (condition.includes('===')) {
        const [left, right] = condition.split('===').map(part => part.trim());
        if (left in data) {
          return data[left] === right.replace(/['"]/g, '');
        }
      }
      
      // If we can't safely evaluate, assume the condition is met
      this.log('Could not safely evaluate condition, defaulting to true');
      return true;
    } catch (error) {
      console.error('Error evaluating condition:', condition, error);
      return true; // Default to including sections on error
    }
  }
  
  replaceVariables(text, data) {
    try {
      // Replace all {variable_name} instances with the corresponding value
      return text.replace(/\{([^}]+)\}/g, (match, key) => {
        if (data[key] !== undefined) {
          return data[key];
        }
        this.log(`Warning: Variable ${key} not found in data`);
        return match; // Keep the original if not found
      });
    } catch (error) {
      console.error('Error replacing variables:', error);
      return text; // Return original on error
    }
  }
  
  formatAsHTML(policy, businessName) {
    try {
      let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - ${businessName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            font-size: 24px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        h2 {
            font-size: 20px;
            margin-top: 30px;
        }
        h3 {
            font-size: 18px;
            margin-top: 25px;
        }
        p {
            margin: 15px 0;
        }
        ul {
            margin: 15px 0;
            padding-left: 30px;
            list-style-position: outside; /* Keep bullets outside the text flow */
            width: auto; /* Ensure lists don't expand beyond container */
        }
        li {
            margin-bottom: 8px;
            text-indent: 0; /* Prevent text indentation */
            padding-left: 5px; /* Small padding after bullet */
            width: calc(100% - 10px); /* Ensure list items respect container width */
            box-sizing: border-box;
        }
        /* Special styling for definition lists */
        .definitions-list {
            margin-left: 0;
            padding-left: 20px;
            width: calc(100% - 20px);
        }
        .definitions-list li {
            margin-bottom: 12px;
            padding-right: 10px;
        }
        .effective-date {
            margin-top: 40px;
            font-style: italic;
            color: #666;
        }
        /* Force all content to wrap */
        * {
            overflow-wrap: break-word;
            word-wrap: break-word;
            word-break: break-word;
            hyphens: auto;
        }
    </style>
</head>
<body>
    <h1>Privacy Policy - ${businessName}</h1>
    <p class="effective-date">Effective Date: ${policy.effectiveDate}</p>
`;
      
      if (!policy.sections || policy.sections.length === 0) {
        html += `    <p>Error: No policy sections were generated.</p>`;
      } else {
        policy.sections.forEach(section => {
          if (!section.title || !section.content) {
            return; // Skip invalid sections
          }
          
          html += `    <h2>${section.title}</h2>\n`;
          
          // Special handling for the Definitions section to fix bullet point indentation
          if (section.title.includes("Definitions")) {
            // Extract the initial paragraph text (before the bullet points)
            const introText = section.content.split('\n\n')[0];
            
            // Get the bullet points
            const bulletPointsMatch = section.content.match(/\n\n([\s\S]*)/);
            let bulletPoints = bulletPointsMatch ? bulletPointsMatch[1] : '';
            
            // Format the bullet points properly
            if (bulletPoints) {
              bulletPoints = bulletPoints
                .replace(/- \*\*([^:*]+)\*\*:/g, '- <strong>$1</strong>:') // Format definition terms
                .replace(/- \*\*([^:*]+)\*\*/g, '- <strong>$1</strong>') // Format other bold items
                .split('\n-').map(point => point.trim())
                .filter(point => point.length > 0)
                .map(point => `<li>${point.startsWith('-') ? point.substring(1).trim() : point}</li>`)
                .join('\n');
                
              html += `    <p>${introText}</p>\n`;
              html += `    <ul class="definitions-list">\n${bulletPoints}\n    </ul>\n`;
            } else {
              html += `    <p>${section.content}</p>\n`;
            }
          } else {
            // Regular content formatting for other sections
            let sectionContent = section.content;
            
            // Handle markdown-style formatting
            sectionContent = sectionContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'); // Bold text
            
            // Handle headings
            sectionContent = sectionContent.replace(/(### |## )([^\n]+)/g, '</p><h3>$2</h3><p>');
            
            // Handle paragraphs
            sectionContent = sectionContent.replace(/\n\n/g, '</p><p>');
            
            // Handle bullet points properly
            if (sectionContent.includes('\n- ')) {
              // Split by paragraphs first
              const paragraphs = sectionContent.split('</p><p>');
              
              let formattedContent = '';
              
              paragraphs.forEach(para => {
                if (para.includes('\n- ')) {
                  // This paragraph contains bullet points
                  const [beforeList, ...listContent] = para.split('\n- ');
                  
                  // Add the text before the list
                  if (beforeList.trim()) {
                    formattedContent += `<p>${beforeList.trim()}</p>`;
                  }
                  
                  // Format the list items
                  const listItems = listContent.map(item => `<li>${item.trim()}</li>`).join('');
                  formattedContent += `<ul>${listItems}</ul>`;
                } else {
                  // Regular paragraph
                  if (para.trim()) {
                    formattedContent += `<p>${para.trim()}</p>`;
                  }
                }
              });
              
              sectionContent = formattedContent;
            } else {
              // No bullet points, just wrap in paragraph tags if needed
              if (!sectionContent.startsWith('<p>')) {
                sectionContent = `<p>${sectionContent}</p>`;
              }
            }
            
            // Clean up any leftover placeholders or double tags
            sectionContent = sectionContent
              .replace(/<p><\/p>/g, '')
              .replace(/<p><p>/g, '<p>')
              .replace(/<\/p><\/p>/g, '</p>')
              .replace(/<\/h3><p><\/p>/g, '</h3>');
            
            html += `    ${sectionContent}\n`;
          }
        });
      }
      
      html += `</body>
</html>`;
      
      return html;
    } catch (error) {
      console.error('Error formatting HTML:', error);
      return `<html><body><h1>Error Generating Policy</h1><p>There was an error formatting the policy: ${error.message}</p></body></html>`;
    }
  }
  
  formatAsMarkdown(policy, businessName) {
    try {
      let markdown = `# Privacy Policy - ${businessName}\n\n`;
      markdown += `*Effective Date: ${policy.effectiveDate}*\n\n`;
      
      if (!policy.sections || policy.sections.length === 0) {
        markdown += `Error: No policy sections were generated.\n\n`;
      } else {
        policy.sections.forEach(section => {
          if (!section.title || !section.content) {
            return; // Skip invalid sections
          }
          
          markdown += `## ${section.title}\n\n`;
          markdown += `${section.content}\n\n`;
        });
      }
      
      return markdown;
    } catch (error) {
      console.error('Error formatting Markdown:', error);
      return `# Error Generating Policy\n\nThere was an error formatting the policy: ${error.message}`;
    }
  }
  
  formatAsText(policy, businessName) {
    try {
      let text = `PRIVACY POLICY - ${businessName}\n\n`;
      text += `Effective Date: ${policy.effectiveDate}\n\n`;
      
      if (!policy.sections || policy.sections.length === 0) {
        text += `Error: No policy sections were generated.\n\n`;
      } else {
        policy.sections.forEach(section => {
          if (!section.title || !section.content) {
            return; // Skip invalid sections
          }
          
          text += `${section.title.toUpperCase()}\n\n`;
          
          // Remove markdown formatting for plain text
          let content = section.content
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold formatting
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)') // Convert links to text with URL in parentheses
            .replace(/(### |## )([^\n]+)/g, '$2:'); // Convert headings to text with colon
          
          text += `${content}\n\n`;
        });
      }
      
      return text;
    } catch (error) {
      console.error('Error formatting Text:', error);
      return `ERROR GENERATING POLICY\n\nThere was an error formatting the policy: ${error.message}`;
    }
  }
}

// Export for browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PrivacyPolicyGenerator;
} else {
  window.PrivacyPolicyGenerator = PrivacyPolicyGenerator;
}
