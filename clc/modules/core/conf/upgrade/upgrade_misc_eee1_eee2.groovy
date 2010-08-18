import com.eucalyptus.config.ClusterConfiguration;
import com.eucalyptus.config.VMwareBrokerConfiguration;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;
import org.mortbay.log.Log;

import groovy.sql.Sql;
import com.eucalyptus.upgrade.AbstractUpgradeScript;
import com.eucalyptus.upgrade.StandalonePersistence;
import com.eucalyptus.entities.IpRange;
import com.eucalyptus.entities.NetworkPeer;
import com.eucalyptus.entities.NetworkRule;
import com.eucalyptus.entities.NetworkRulesGroup;
import com.eucalyptus.entities.PersistenceContexts;
import com.eucalyptus.entities.Counters;
import com.eucalyptus.entities.EntityWrapper;
import edu.ucsb.eucalyptus.cloud.entities.*;
import edu.ucsb.eucalyptus.cloud.ws.WalrusControl;
import com.eucalyptus.images.ImageInfo;
import com.eucalyptus.auth.Users;
import com.eucalyptus.auth.Groups;

class upgrade_misc_eee1_eee2 extends AbstractUpgradeScript {
	static final String FROM_VERSION = "1.6-devel-vmware-broker";
	static final String TO_VERSION = "eee-2.0.0";

	public upgrade_misc_eee1_eee2() {
		super(4);
	}
	
	@Override
	public Boolean accepts( String from, String to ) {
		if(FROM_VERSION.equals(from) && TO_VERSION.equals(to))
			return true;
		return false;
	}
	
	@Override
	public void upgrade(File oldEucaHome, File newEucaHome) {
		EntityWrapper<ImageInfo> db = new EntityWrapper<ImageInfo>("eucalyptus_general");
		try {
			for( ImageInfo img : db.query( new ImageInfo() ) ) {
				img.grantPermission( Users.lookupUser( img.getImageOwnerId( ) ) );
				img.grantPermission( Groups.lookupGroup( "all" ) );
				img.setPlatform("linux");
			}
			db.commit( );
		} catch( Throwable e ) {
			e.printStackTrace();
			db.rollback( );
		}
		
		//vmware broker config
		EntityWrapper dbConfig = new EntityWrapper("eucalyptus_config");
		try {
			for (ClusterConfiguration clusterConfig: dbConfig.query(new ClusterConfiguration())) {
				VMwareBrokerConfiguration vmwareBrokerConfig = new VMwareBrokerConfiguration(clusterConfig.getName(), clusterConfig.getHostName(), 8773);
				println "Adding VMwareBroker: " + vmwareBrokerConfig.getHostName();
				dbConfig.add(vmwareBrokerConfig);
			}
			dbConfig.commit();
		} catch( Throwable e ) {
			e.printStackTrace();
			db.rollback( );
		}
		//Network rules
		def gen_conn = StandalonePersistence.getConnection("eucalyptus_general");
		gen_conn.rows('SELECT * FROM metadata_network_group').each{
			EntityWrapper dbGen = new EntityWrapper("eucalyptus_general");
			try {
				NetworkRulesGroup rulesGroup = new NetworkRulesGroup(it.METADATA_USER_NAME, it.METADATA_DISPLAY_NAME, it.METADATA_NETWORK_GROUP_DESCRIPTION);
				println "Adding network rules for ${it.METADATA_USER_NAME}/${it.METADATA_DISPLAY_NAME}";
				gen_conn.rows("SELECT r.* FROM metadata_network_group_has_rules has_thing LEFT OUTER JOIN metadata_network_rule r on r.metadata_network_rule_id=has_thing.metadata_network_rule_id WHERE has_thing.id=${ it.ID }").each{  rule ->
					NetworkRule networkRule = new NetworkRule(rule.metadata_network_rule_protocol, rule.metadata_network_rule_low_port, rule.metadata_network_rule_high_port);
					gen_conn.rows("SELECT ip.* FROM metadata_network_rule_has_ip_range has_thing LEFT OUTER JOIN metadata_network_rule_ip_range ip on ip.metadata_network_rule_ip_range_id=has_thing.metadata_network_rule_ip_range_id WHERE has_thing.metadata_network_rule_id=${ rule.metadata_network_rule_id }").each{  iprange ->
						IpRange ipRange = new IpRange(iprange.metadata_network_rule_ip_range_value);
						networkRule.getIpRanges().add(ipRange);
						println "IP Range: ${iprange.metadata_network_rule_ip_range_value}";
					}
					gen_conn.rows("SELECT peer.* FROM metadata_network_rule_has_peer_network has_stuff LEFT OUTER JOIN network_rule_peer_network peer on peer.network_rule_peer_network_id=has_stuff.metadata_network_rule_peer_network_id WHERE has_stuff.metadata_network_rule_id=${ rule.metadata_network_rule_id }").each{  peer ->
						NetworkPeer networkPeer = new NetworkPeer(peer.network_rule_peer_network_user_query_key, peer.network_rule_peer_network_user_group);
						networkRule.getNetworkPeers().add(networkPeer);
						println "Peer: " + networkPeer;
					}					
					rulesGroup.getNetworkRules().add(networkRule);
				}
				dbGen.add(rulesGroup);
				dbGen.commit();
			} catch (Throwable t) {
				t.printStackTrace();
				dbGen.rollback();
			}
		}
	}
}