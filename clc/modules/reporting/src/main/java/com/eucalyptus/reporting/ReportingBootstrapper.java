package com.eucalyptus.reporting;

import java.util.*;

import org.apache.log4j.*;

import com.eucalyptus.bootstrap.Bootstrap;
import com.eucalyptus.bootstrap.Bootstrapper;
import com.eucalyptus.bootstrap.Provides;
import com.eucalyptus.bootstrap.RunDuring;
import com.eucalyptus.component.*;
import com.eucalyptus.component.id.Reporting;
import com.eucalyptus.event.Event;
import com.eucalyptus.event.EventListener;
import com.eucalyptus.event.ListenerRegistry;
import com.eucalyptus.reporting.event.InstanceEvent;
import com.eucalyptus.reporting.event.StorageEvent;
import com.eucalyptus.reporting.instance.*;
import com.eucalyptus.reporting.storage.*;
import com.eucalyptus.reporting.queue.*;
import com.eucalyptus.reporting.queue.QueueFactory.QueueIdentifier;

@Provides(Reporting.class)
@RunDuring(Bootstrap.Stage.RemoteServicesInit)
public class ReportingBootstrapper
	extends Bootstrapper
{
	private static Logger log = Logger.getLogger( ReportingBootstrapper.class );

	private static long POLLER_DELAY_MS = 10000l;

	private StorageEventPoller storagePoller;
	private InstanceEventListener instanceListener;
	private QueueFactory queueFactory;
	private Timer timer;


	public ReportingBootstrapper()
	{
		this.instanceListener = null;
	}

	@Override
	public boolean check()
	{
		return true;
	}

	@Override
	public void destroy()
	{
		return;
	}

	@Override
	public boolean enable()
	{
		return true;
	}

	@Override
	public boolean disable()
	{
		return true;
	}

	@Override
	public boolean load()
	{
		try {
			return true;
		} catch (Exception ex) {
			log.error("ReportingBootstrapper failed to load", ex);
			return false;
		}
	}



	@Override
	public boolean start()
	{
		try {


			/* Start queue broker
			 */
			QueueBroker.getInstance().startup();
			log.info("Queue broker started");

			queueFactory = QueueFactory.getInstance();
			queueFactory.startup();

			/* Start storage receiver and storage queue poller thread
			 */
			QueueReceiver storageReceiver =
				queueFactory.getReceiver(QueueIdentifier.STORAGE);
			final StorageEventPoller poller = new StorageEventPoller(storageReceiver);
			this.storagePoller = poller;
			timer = new Timer(true);
			timer.schedule(new TimerTask() {
				@Override
				public void run()
				{
					poller.writeEvents();
				}
			}, 0, POLLER_DELAY_MS);
			log.info("Storage queue poller started");

			/* Start instance receiver and instance listener
			 */
			QueueReceiver instanceReceiver =
				queueFactory.getReceiver(QueueIdentifier.INSTANCE);
			if (instanceListener == null) {
				instanceListener = new InstanceEventListener();
				log.info("New instance listener instantiated");
			} else {
				log.info("Used existing instance listener");
			}
			instanceReceiver.addEventListener(instanceListener);

      ListenerRegistry.getInstance( ).register( InstanceEvent.class, new EventListener( ) {

        @Override
        public void fireEvent( Event event ) {
          if ( event instanceof InstanceEvent ) {
            QueueSender sender = QueueFactory.getInstance( ).getSender( QueueIdentifier.INSTANCE );
            sender.send( ( com.eucalyptus.reporting.event.Event ) event );
          }
        }
      }
                      );
      
      ListenerRegistry.getInstance( ).register( StorageEvent.class, new EventListener( ) {
        
        @Override
        public void fireEvent( Event event ) {
          if ( event instanceof StorageEvent ) {
            QueueSender sender = QueueFactory.getInstance( ).getSender( QueueIdentifier.STORAGE );
            sender.send( ( com.eucalyptus.reporting.event.Event ) event );
          }
        }
      }
                      );
			
			log.info("ReportingBootstrapper started");
			return true;
		} catch (Exception ex) {
			ex.printStackTrace();
			log.error("ReportingBootstrapper failed to start", ex);
			return false;
		}
	}

	public static void startTest()
	{
		ReportingBootstrapper bootstrapper = new ReportingBootstrapper();
		bootstrapper.load();
		bootstrapper.start();
		try {
			System.out.println("Sleeping for 60 secs");
			Thread.sleep(60000);
		} catch (Exception ex) {
			ex.printStackTrace();
		}
	}
	
	@Override
	public boolean stop()
	{
		try {
			log.info("ReportingBootstrapper stopped");
			instanceListener.flush();
			timer.cancel();
			storagePoller.writeEvents();
			queueFactory.shutdown();
			return true;
		} catch (Exception ex) {
			log.error("ReportingBootstrapper failed to stop", ex);
			return false;
		}
	}


	/* Following methods are used by the testing framework only
	 */

	/**
	 * This method is used by the testing framework only. It inserts its own
	 * event listener which extends the normal one but makes up fake
	 * timestamps. 
	 */
	public void setOverriddenInstanceEventListener(
			InstanceEventListener overriddenListener)
	{
		this.instanceListener = overriddenListener;
	}

	/**
	 * This method is used by the testing framework only. 
	 */
	public StorageEventPoller getOverriddenStorageEventPoller()
	{
		return this.storagePoller;
	}

}
